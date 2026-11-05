//! SQLite for the desktop app: one connection to `orbit.db` in the app data
//! directory, exposed to the frontend as two commands that return rows as
//! arrays (so joined columns with the same name never overwrite each other).

use std::sync::Mutex;

use rusqlite::types::{Value as SqlValue, ValueRef};
use rusqlite::{params_from_iter, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value as Json;
use tauri::{Manager, State};

pub struct Db(Mutex<Connection>);

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Method {
    Run,
    All,
    Values,
    Get,
}

#[derive(Debug, Deserialize)]
pub struct Query {
    pub sql: String,
    #[serde(default)]
    pub params: Vec<Json>,
    pub method: Method,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct QueryResult {
    pub rows: Vec<Vec<Json>>,
}

/// Opens (and creates) `orbit.db` in the data directory of the running app
/// identity, so "Orbit Dev" and "Orbit" use separate files.
pub fn open(app: &tauri::App) -> Result<Db, Box<dyn std::error::Error>> {
    let dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&dir)?;
    let conn = Connection::open(dir.join("orbit.db"))?;
    conn.pragma_update_and_check(None, "journal_mode", "WAL", |row| row.get::<_, String>(0))?;
    conn.busy_timeout(std::time::Duration::from_secs(5))?;
    Ok(Db(Mutex::new(conn)))
}

#[tauri::command(async)]
pub fn db_query(
    db: State<'_, Db>,
    sql: String,
    params: Vec<Json>,
    method: Method,
) -> Result<QueryResult, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    run_query(&conn, &Query { sql, params, method })
}

#[tauri::command(async)]
pub fn db_batch(db: State<'_, Db>, queries: Vec<Query>) -> Result<Vec<QueryResult>, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    run_batch(&mut conn, &queries)
}

/// Runs one statement. `run` discards rows, `get` keeps at most one.
pub fn run_query(conn: &Connection, query: &Query) -> Result<QueryResult, String> {
    let mut stmt = conn.prepare(&query.sql).map_err(|e| e.to_string())?;
    let params = query
        .params
        .iter()
        .map(to_sql)
        .collect::<Result<Vec<_>, _>>()?;
    let columns = stmt.column_count();
    let mut rows = stmt
        .query(params_from_iter(params))
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        if query.method == Method::Run {
            continue;
        }
        let mut values = Vec::with_capacity(columns);
        for i in 0..columns {
            values.push(to_json(row.get_ref(i).map_err(|e| e.to_string())?));
        }
        out.push(values);
        if query.method == Method::Get {
            break;
        }
    }
    Ok(QueryResult { rows: out })
}

/// Runs all statements in one transaction; the first error rolls back all.
pub fn run_batch(conn: &mut Connection, queries: &[Query]) -> Result<Vec<QueryResult>, String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut results = Vec::with_capacity(queries.len());
    for query in queries {
        results.push(run_query(&tx, query)?);
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(results)
}

fn to_sql(value: &Json) -> Result<SqlValue, String> {
    Ok(match value {
        Json::Null => SqlValue::Null,
        Json::Bool(b) => SqlValue::Integer(i64::from(*b)),
        Json::Number(n) => match n.as_i64() {
            Some(i) => SqlValue::Integer(i),
            None => SqlValue::Real(n.as_f64().ok_or("number out of range")?),
        },
        Json::String(s) => SqlValue::Text(s.clone()),
        other => return Err(format!("unsupported SQL parameter: {other}")),
    })
}

fn to_json(value: ValueRef<'_>) -> Json {
    match value {
        ValueRef::Null => Json::Null,
        ValueRef::Integer(i) => Json::from(i),
        ValueRef::Real(f) => serde_json::Number::from_f64(f).map_or(Json::Null, Json::Number),
        ValueRef::Text(t) => Json::String(String::from_utf8_lossy(t).into_owned()),
        ValueRef::Blob(b) => Json::Array(b.iter().map(|byte| Json::from(*byte)).collect()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn q(sql: &str, params: Vec<Json>, method: Method) -> Query {
        Query { sql: sql.into(), params, method }
    }

    #[test]
    fn converts_values_both_ways() {
        let conn = Connection::open_in_memory().unwrap();
        let result = run_query(
            &conn,
            &q(
                "select ?, ?, ?, ?, ?",
                vec![json!(null), json!(42), json!(1.5), json!("text"), json!(true)],
                Method::All,
            ),
        )
        .unwrap();
        assert_eq!(result.rows, vec![vec![json!(null), json!(42), json!(1.5), json!("text"), json!(1)]]);
    }

    #[test]
    fn returns_duplicate_column_names_as_separate_values() {
        let conn = Connection::open_in_memory().unwrap();
        let result = run_query(&conn, &q("select 1 as id, 2 as id", vec![], Method::Values)).unwrap();
        assert_eq!(result.rows, vec![vec![json!(1), json!(2)]]);
    }

    #[test]
    fn run_discards_rows_and_get_keeps_one() {
        let conn = Connection::open_in_memory().unwrap();
        run_query(&conn, &q("create table t (v integer)", vec![], Method::Run)).unwrap();
        run_query(&conn, &q("insert into t values (1), (2)", vec![], Method::Run)).unwrap();
        let run = run_query(&conn, &q("select v from t", vec![], Method::Run)).unwrap();
        assert!(run.rows.is_empty());
        let get = run_query(&conn, &q("select v from t order by v", vec![], Method::Get)).unwrap();
        assert_eq!(get.rows, vec![vec![json!(1)]]);
    }

    #[test]
    fn batch_rolls_back_on_error() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_query(&conn, &q("create table t (v integer primary key)", vec![], Method::Run)).unwrap();
        let result = run_batch(
            &mut conn,
            &[
                q("insert into t values (1)", vec![], Method::Run),
                q("insert into t values (1)", vec![], Method::Run),
            ],
        );
        assert!(result.is_err());
        let count = run_query(&conn, &q("select count(*) from t", vec![], Method::Get)).unwrap();
        assert_eq!(count.rows, vec![vec![json!(0)]]);
    }

    #[test]
    fn batch_rolls_back_user_version() {
        let mut conn = Connection::open_in_memory().unwrap();
        let result = run_batch(
            &mut conn,
            &[
                q("pragma user_version = 1", vec![], Method::Run),
                q("select * from missing_table", vec![], Method::Run),
            ],
        );
        assert!(result.is_err());
        let version = run_query(&conn, &q("pragma user_version", vec![], Method::Get)).unwrap();
        assert_eq!(version.rows, vec![vec![json!(0)]]);
    }
}
