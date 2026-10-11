import '../time/calendar_date.dart';

/// A Hubble image bundled as an app background (assets/space). ESA/Hubble
/// images are CC BY 4.0: the credit is shown in Settings › Space images.
class SpaceImage {
  const SpaceImage({
    required this.name,
    required this.title,
    required this.credit,
    required this.source,
  });

  /// File name without extension; also the stored setting value.
  final String name;
  final String title;
  final String credit;

  /// The image's page at esahubble.org.
  final String source;

  String get asset => 'assets/space/$name.jpg';
}

const spaceImages = [
  SpaceImage(
    name: 'pillars_of_creation',
    title: 'Pillars of Creation',
    credit: 'NASA, ESA/Hubble and the Hubble Heritage Team',
    source: 'https://esahubble.org/images/heic1501a/',
  ),
  SpaceImage(
    name: 'mystic_mountain',
    title: 'Mystic Mountain',
    credit: 'NASA, ESA, M. Livio and the Hubble 20th Anniversary Team (STScI)',
    source: 'https://esahubble.org/images/heic1007a/',
  ),
  SpaceImage(
    name: 'whirlpool_galaxy',
    title: 'Whirlpool Galaxy',
    credit:
        'NASA, ESA, S. Beckwith (STScI), and The Hubble Heritage Team '
        '(STScI/AURA)',
    source: 'https://esahubble.org/images/heic0506a/',
  ),
  SpaceImage(
    name: 'crab_nebula',
    title: 'Crab Nebula',
    credit:
        'NASA, ESA and Allison Loll/Jeff Hester (Arizona State University). '
        'Acknowledgement: Davide De Martin (ESA/Hubble)',
    source: 'https://esahubble.org/images/heic0515a/',
  ),
  SpaceImage(
    name: 'orion_nebula',
    title: 'Orion Nebula',
    credit:
        'NASA, ESA, M. Robberto (Space Telescope Science Institute/ESA) and '
        'the Hubble Space Telescope Orion Treasury Project Team',
    source: 'https://esahubble.org/images/heic0601a/',
  ),
  SpaceImage(
    name: 'lagoon_nebula',
    title: 'Lagoon Nebula',
    credit: 'NASA, ESA, STScI',
    source: 'https://esahubble.org/images/heic1808a/',
  ),
  SpaceImage(
    name: 'butterfly_nebula',
    title: 'Butterfly Nebula',
    credit: 'NASA, ESA and the Hubble SM4 ERO Team',
    source: 'https://esahubble.org/images/heic0910h/',
  ),
  SpaceImage(
    name: 'westerlund_2',
    title: 'Westerlund 2',
    credit:
        'NASA, ESA, the Hubble Heritage Team (STScI/AURA), A. Nota '
        '(ESA/STScI), and the Westerlund 2 Science Team',
    source: 'https://esahubble.org/images/heic1509a/',
  ),
  SpaceImage(
    name: 'ngc_2174',
    title: 'NGC 2174',
    credit: 'NASA, ESA, and the Hubble Heritage Team (STScI/AURA)',
    source: 'https://esahubble.org/images/heic1406a/',
  ),
  SpaceImage(
    name: 'ultra_deep_field',
    title: 'Hubble Ultra Deep Field',
    credit: 'NASA, ESA, and S. Beckwith (STScI) and the HUDF Team',
    source: 'https://esahubble.org/images/heic0611b/',
  ),
  SpaceImage(
    name: 'galaxy_rose',
    title: 'A rose made of galaxies',
    credit: 'NASA, ESA and the Hubble Heritage Team (STScI/AURA)',
    source: 'https://esahubble.org/images/heic1107a/',
  ),
  SpaceImage(
    name: 'light_echo',
    title: 'Light echo of V838 Monocerotis',
    credit: 'NASA, ESA, and The Hubble Heritage Team (AURA/STScI)',
    source: 'https://esahubble.org/images/heic0503a/',
  ),
];

/// The background of [day]: [pinned] when it names an image, otherwise one
/// image per day, cycling through all of them.
SpaceImage spaceImageFor(CalendarDate day, {String? pinned}) {
  for (final image in spaceImages) {
    if (image.name == pinned) return image;
  }
  final days = day.toLocalDateTime().difference(DateTime(2026)).inDays;
  return spaceImages[days % spaceImages.length];
}
