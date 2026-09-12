/* ==========================================================
   REVERSE PROMPT BATTLE // CLIENT ENGINE
   Safe Anti-Spam Queueing & Calibrated Matching
   ========================================================== */

const ROUND_TIME_SECONDS = 120;

const TARGET_ARTWORKS = [
  {
    id: "mona_lisa",
    title: "Мона Лиза",
    epoch: "Высокое Возрождение (1503)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg?width=900",
    stopWords: [
      "мона лиза",
      "джоконда",
      "леонардо",
      "да винчи",
      "винчи",
      "mona lisa",
      "gioconda",
      "da vinci",
    ],
    markers: [
      {
        label: "Загадочная улыбка",
        stems: ["улыбк", "улыба", "мимик", "взгляд", "лиц", "smile", "face"],
      },
      {
        label: "Темное платье / наряд",
        stems: [
          "темн",
          "черн",
          "плать",
          "одежд",
          "наряд",
          "ткань",
          "dress",
          "dark",
          "robe",
        ],
      },
      {
        label: "Сложенные руки",
        stems: ["рук", "кист", "сложен", "ладон", "hands", "folded"],
      },
      {
        label: "Прозрачная вуаль",
        stems: ["вуал", "накидк", "плат", "покров", "veil", "drape"],
      },
      {
        label: "Горный пейзаж вдали",
        stems: [
          "пейзаж",
          "фон",
          "гор",
          "рек",
          "мост",
          "природ",
          "даль",
          "landscape",
          "mountains",
        ],
      },
    ],
    gridHSV: [
      [65, 0.25, 0.42],
      [70, 0.28, 0.45],
      [68, 0.27, 0.46],
      [62, 0.24, 0.41],
      [45, 0.3, 0.25],
      [35, 0.38, 0.68],
      [36, 0.36, 0.66],
      [42, 0.26, 0.24],
      [50, 0.22, 0.2],
      [45, 0.24, 0.22],
      [46, 0.25, 0.23],
      [52, 0.2, 0.19],
      [40, 0.2, 0.16],
      [36, 0.32, 0.58],
      [37, 0.3, 0.56],
      [42, 0.18, 0.15],
    ],
    gridEdges: [
      0.25, 0.3, 0.3, 0.25, 0.35, 0.65, 0.65, 0.35, 0.2, 0.25, 0.25, 0.2, 0.15,
      0.55, 0.55, 0.15,
    ],
  },
  {
    id: "starry_night",
    title: "Звездная ночь",
    epoch: "Постимпрессионизм (1889)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg?width=900",
    stopWords: [
      "звездная ночь",
      "ван гог",
      "винсент",
      "starry night",
      "van gogh",
      "gogh",
    ],
    markers: [
      {
        label: "Вихри на небе",
        stems: ["вихр", "спирал", "волн", "неб", "завихрен", "swirl", "sky"],
      },
      {
        label: "Яркий полумесяц",
        stems: ["лун", "месяц", "полумесяц", "moon", "crescent"],
      },
      {
        label: "Светящиеся звезды",
        stems: ["звезд", "свечени", "огни", "stars", "glowing"],
      },
      {
        label: "Темный кипарис",
        stems: [
          "кипарис",
          "дерев",
          "силуэт",
          "ветв",
          "растени",
          "cypress",
          "tree",
        ],
      },
      {
        label: "Деревня со шпилем",
        stems: [
          "деревн",
          "город",
          "дом",
          "шпил",
          "башн",
          "церков",
          "village",
          "church",
        ],
      },
    ],
    gridHSV: [
      [140, 0.35, 0.22],
      [215, 0.75, 0.55],
      [218, 0.72, 0.58],
      [48, 0.85, 0.85],
      [140, 0.35, 0.18],
      [205, 0.65, 0.7],
      [210, 0.68, 0.62],
      [50, 0.75, 0.72],
      [142, 0.3, 0.16],
      [220, 0.6, 0.38],
      [222, 0.58, 0.36],
      [215, 0.55, 0.32],
      [145, 0.28, 0.14],
      [212, 0.45, 0.26],
      [214, 0.42, 0.25],
      [210, 0.4, 0.22],
    ],
    gridEdges: [
      0.45, 0.85, 0.85, 0.8, 0.5, 0.9, 0.85, 0.75, 0.45, 0.6, 0.58, 0.5, 0.4,
      0.65, 0.6, 0.5,
    ],
  },
  {
    id: "the_scream",
    title: "Крик",
    epoch: "Экспрессионизм (1893)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg?width=900",
    stopWords: ["мунк", "эдвард", "munch", "edvard", "the scream"],
    markers: [
      {
        label: "Кричащий персонаж",
        stems: [
          "крич",
          "человек",
          "фигур",
          "существ",
          "лиц",
          "рот",
          "man",
          "person",
          "screaming",
        ],
      },
      {
        label: "Руки у головы",
        stems: ["рук", "голов", "щек", "уш", "хвата", "hands", "head"],
      },
      {
        label: "Огненный закат",
        stems: [
          "оранжев",
          "красн",
          "пламен",
          "закат",
          "неб",
          "горизонт",
          "orange",
          "red",
          "sunset",
        ],
      },
      {
        label: "Мост с перилами",
        stems: [
          "мост",
          "перил",
          "огражд",
          "доск",
          "дорог",
          "bridge",
          "railing",
        ],
      },
      {
        label: "Фигуры в отдалении",
        stems: [
          "фигур",
          "люд",
          "прохож",
          "вдал",
          "силуэт",
          "people",
          "figures",
        ],
      },
    ],
    gridHSV: [
      [20, 0.88, 0.84],
      [22, 0.86, 0.82],
      [24, 0.84, 0.8],
      [26, 0.82, 0.78],
      [28, 0.65, 0.5],
      [215, 0.7, 0.32],
      [216, 0.68, 0.3],
      [218, 0.65, 0.26],
      [32, 0.52, 0.42],
      [42, 0.32, 0.74],
      [44, 0.3, 0.72],
      [216, 0.62, 0.24],
      [36, 0.42, 0.36],
      [220, 0.32, 0.2],
      [222, 0.3, 0.19],
      [215, 0.5, 0.2],
    ],
    gridEdges: [
      0.75, 0.8, 0.8, 0.75, 0.65, 0.65, 0.6, 0.55, 0.7, 0.85, 0.85, 0.5, 0.6,
      0.55, 0.55, 0.45,
    ],
  },
  {
    id: "great_wave",
    title: "Большая волна в Канагаве",
    epoch: "Японская гравюра укиё-э (1831)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Great_Wave_off_Kanagawa2.jpg?width=900",
    stopWords: [
      "канагава",
      "канагаве",
      "хокусай",
      "кацусика",
      "фудзи",
      "kanagawa",
      "hokusai",
      "fuji",
      "great wave",
    ],
    markers: [
      {
        label: "Гигантская волна",
        stems: [
          "волн",
          "гребень",
          "цунами",
          "шторм",
          "вод",
          "мор",
          "wave",
          "ocean",
        ],
      },
      {
        label: "Пена в форме когтей",
        stems: ["пен", "когт", "брызг", "капл", "foam", "spray"],
      },
      {
        label: "Деревянные лодки",
        stems: ["лодк", "судн", "гребц", "корабл", "boat", "rowers"],
      },
      {
        label: "Гора на горизонте",
        stems: ["гор", "вулкан", "пик", "вдал", "mountain", "peak"],
      },
      {
        label: "Графика укиё-э / лазурь",
        stems: [
          "лазур",
          "син",
          "гравюр",
          "контур",
          "япон",
          "blue",
          "woodblock",
          "print",
        ],
      },
    ],
    gridHSV: [
      [210, 0.65, 0.78],
      [212, 0.62, 0.74],
      [42, 0.18, 0.88],
      [42, 0.16, 0.88],
      [215, 0.82, 0.46],
      [214, 0.8, 0.48],
      [215, 0.45, 0.56],
      [42, 0.2, 0.84],
      [212, 0.78, 0.4],
      [214, 0.75, 0.42],
      [210, 0.7, 0.45],
      [212, 0.68, 0.5],
      [215, 0.85, 0.32],
      [216, 0.82, 0.35],
      [212, 0.76, 0.38],
      [214, 0.72, 0.42],
    ],
    gridEdges: [
      0.85, 0.85, 0.2, 0.15, 0.85, 0.8, 0.45, 0.25, 0.7, 0.65, 0.6, 0.55, 0.65,
      0.65, 0.6, 0.55,
    ],
  },
  {
    id: "pearl_earring",
    title: "Девушка с жемчужной сережкой",
    epoch: "Голландское барокко (1665)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/1665_Girl_with_a_Pearl_Earring.jpg?width=900",
    stopWords: [
      "вермеер",
      "вермеера",
      "vermeer",
      "жемчужной сережкой",
      "жемчужная сережка",
      "pearl earring",
    ],
    markers: [
      {
        label: "Крупная жемчужина",
        stems: [
          "жемчуг",
          "жемчужин",
          "серьг",
          "сережк",
          "капл",
          "pearl",
          "earring",
        ],
      },
      {
        label: "Синий тюрбан",
        stems: [
          "тюрбан",
          "повязк",
          "платок",
          "головн",
          "син",
          "голуб",
          "turban",
          "blue",
        ],
      },
      {
        label: "Желто-охристое одеяние",
        stems: [
          "желт",
          "охр",
          "коричнев",
          "накидк",
          "ворот",
          "yellow",
          "jacket",
        ],
      },
      {
        label: "Взгляд через плечо",
        stems: ["плеч", "взгляд", "поворот", "глаз", "лиц", "look", "shoulder"],
      },
      {
        label: "Глубокий черный фон",
        stems: ["черн", "темн", "фон", "пустот", "black", "dark", "background"],
      },
    ],
    gridHSV: [
      [0, 0.0, 0.08],
      [0, 0.0, 0.08],
      [0, 0.0, 0.08],
      [0, 0.0, 0.08],
      [0, 0.0, 0.08],
      [215, 0.72, 0.54],
      [212, 0.68, 0.52],
      [0, 0.0, 0.08],
      [0, 0.0, 0.08],
      [32, 0.34, 0.8],
      [34, 0.32, 0.76],
      [0, 0.0, 0.08],
      [0, 0.0, 0.08],
      [40, 0.52, 0.46],
      [42, 0.48, 0.42],
      [0, 0.0, 0.08],
    ],
    gridEdges: [
      0.05, 0.05, 0.05, 0.05, 0.1, 0.7, 0.65, 0.1, 0.1, 0.85, 0.85, 0.1, 0.08,
      0.55, 0.5, 0.08,
    ],
  },
  {
    id: "wanderer",
    title: "Странник над морем тумана",
    epoch: "Немецкий романтизм (1818)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg?width=900",
    stopWords: [
      "странник над морем",
      "фридрих",
      "каспар",
      "wanderer above",
      "friedrich",
      "caspar",
    ],
    markers: [
      {
        label: "Человек со спины",
        stems: [
          "спин",
          "сзад",
          "повернут",
          "человек",
          "мужчин",
          "странник",
          "парен",
          "фигур",
          "силуэт",
          "man",
          "back",
          "behind",
          "figure",
        ],
      },
      {
        label: "Скалистый утес / вершина",
        stems: [
          "скал",
          "утес",
          "камн",
          "вершин",
          "пик",
          "обрыв",
          "холм",
          "cliff",
          "rock",
          "stone",
          "ridge",
          "peak",
        ],
      },
      {
        label: "Море тумана / облака",
        stems: [
          "туман",
          "дымк",
          "мгл",
          "облак",
          "пар",
          "пелен",
          "fog",
          "mist",
          "haze",
          "cloud",
          "sea of fog",
        ],
      },
      {
        label: "Темное пальто / сюртук",
        stems: [
          "пальто",
          "плащ",
          "костюм",
          "пиджак",
          "одежд",
          "фрак",
          "сюртук",
          "темн",
          "черн",
          "coat",
          "jacket",
          "suit",
          "dark",
        ],
      },
      {
        label: "Горные гряды вдали",
        stems: [
          "гор",
          "хребет",
          "вершин",
          "пик",
          "альп",
          "горизонт",
          "пейзаж",
          "mountain",
          "peaks",
          "landscape",
        ],
      },
    ],
    gridHSV: [
      [205, 0.15, 0.78],
      [210, 0.18, 0.8],
      [212, 0.16, 0.79],
      [208, 0.14, 0.76],
      [215, 0.22, 0.62],
      [220, 0.2, 0.58],
      [218, 0.25, 0.6],
      [210, 0.18, 0.65],
      [45, 0.18, 0.35],
      [210, 0.35, 0.24],
      [212, 0.3, 0.26],
      [48, 0.15, 0.38],
      [35, 0.3, 0.2],
      [38, 0.28, 0.18],
      [40, 0.32, 0.22],
      [36, 0.25, 0.21],
    ],
    gridEdges: [
      0.25, 0.28, 0.28, 0.25, 0.4, 0.55, 0.55, 0.4, 0.65, 0.85, 0.85, 0.6, 0.8,
      0.75, 0.75, 0.7,
    ],
  },
  {
    id: "kiss",
    title: "Поцелуй",
    epoch: "Венский модерн / Ар-нуво (1908)",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Gustav_Klimt_016.jpg?width=900",
    stopWords: ["климт", "густав", "klimt", "gustav", "the kiss"],
    markers: [
      {
        label: "Золотые узоры",
        stems: [
          "золот",
          "позолот",
          "узор",
          "орнамент",
          "мозаик",
          "блеск",
          "gold",
          "golden",
          "mosaic",
        ],
      },
      {
        label: "Обнимающаяся пара",
        stems: [
          "пар",
          "объят",
          "обнима",
          "мужчин",
          "женщин",
          "любов",
          "поцелу",
          "couple",
          "embracing",
          "kiss",
        ],
      },
      {
        label: "Цветочная поляна",
        stems: ["цвет", "полян", "луг", "трав", "край", "flowers", "meadow"],
      },
      {
        label: "Орнаментальные одеяния",
        stems: [
          "одеяни",
          "плащ",
          "одежд",
          "геометр",
          "квадрат",
          "круг",
          "pattern",
          "robes",
        ],
      },
    ],
    gridHSV: [
      [45, 0.4, 0.35],
      [48, 0.75, 0.65],
      [46, 0.72, 0.68],
      [44, 0.38, 0.36],
      [42, 0.5, 0.42],
      [46, 0.85, 0.8],
      [48, 0.82, 0.82],
      [44, 0.48, 0.4],
      [40, 0.45, 0.38],
      [45, 0.88, 0.85],
      [47, 0.86, 0.86],
      [42, 0.42, 0.39],
      [95, 0.55, 0.38],
      [110, 0.6, 0.45],
      [105, 0.58, 0.42],
      [90, 0.5, 0.35],
    ],
    gridEdges: [
      0.4, 0.75, 0.75, 0.4, 0.5, 0.95, 0.95, 0.5, 0.45, 0.9, 0.9, 0.45, 0.85,
      0.88, 0.88, 0.8,
    ],
  },
  // {
  //   id: "birth_of_venus",
  //   title: "Рождение Венеры",
  //   epoch: "Раннее Возрождение (1485)",
  //   imageUrl:
  //     "https://commons.wikimedia.org/wiki/Special:FilePath/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg?width=900",
  //   stopWords: [
  //     "венера",
  //     "венеры",
  //     "ботичелли",
  //     "ботиччелли",
  //     "venus",
  //     "botticelli",
  //     "birth of venus",
  //   ],
  //   markers: [
  //     {
  //       label: "Морская раковина",
  //       stems: ["раковин", "гребешок", "ракушк", "створк", "shell", "seashell"],
  //     },
  //     {
  //       label: "Длинные золотистые волосы",
  //       stems: [
  //         "волос",
  //         "рыж",
  //         "золот",
  //         "локон",
  //         "длинн",
  //         "hair",
  //         "blonde",
  //         "red",
  //       ],
  //     },
  //     {
  //       label: "Летящие боги ветра",
  //       stems: [
  //         "ветер",
  //         "зефир",
  //         "крылат",
  //         "летящ",
  //         "дух",
  //         "бог",
  //         "wind",
  //         "flying",
  //       ],
  //     },
  //     {
  //       label: "Парящие розы / лепестки",
  //       stems: ["роз", "цвет", "лепестк", "пада", "парящ", "roses", "petals"],
  //     },
  //     {
  //       label: "Морское побережье",
  //       stems: [
  //         "море",
  //         "берег",
  //         "пляж",
  //         "волн",
  //         "вод",
  //         "sea",
  //         "shore",
  //         "ocean",
  //       ],
  //     },
  //   ],
  //   gridHSV: [
  //     [180, 0.25, 0.68],
  //     [185, 0.22, 0.7],
  //     [182, 0.2, 0.72],
  //     [120, 0.3, 0.55],
  //     [190, 0.35, 0.58],
  //     [35, 0.28, 0.75],
  //     [36, 0.26, 0.74],
  //     [115, 0.4, 0.45],
  //     [195, 0.4, 0.52],
  //     [42, 0.35, 0.65],
  //     [40, 0.32, 0.64],
  //     [110, 0.45, 0.4],
  //     [192, 0.42, 0.48],
  //     [44, 0.4, 0.58],
  //     [42, 0.38, 0.56],
  //     [105, 0.42, 0.38],
  //   ],
  //   gridEdges: [
  //     0.35, 0.3, 0.3, 0.45, 0.65, 0.7, 0.7, 0.6, 0.6, 0.75, 0.75, 0.55, 0.45,
  //     0.65, 0.65, 0.4,
  //   ],
  // },
  {
    id: "persistence_of_memory",
    title: "Постоянство памяти",
    epoch: "Сюрреализм (1931)",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg",
    stopWords: [
      "дали",
      "сальвадор",
      "постоянство памяти",
      "dali",
      "salvador",
      "persistence of memory",
    ],
    markers: [
      {
        label: "Стекающие / мягкие часы",
        stems: [
          "час",
          "циферблат",
          "плав",
          "стека",
          "тает",
          "мягк",
          "clocks",
          "melting",
          "watch",
        ],
      },
      {
        label: "Сухое мертвое дерево",
        stems: [
          "дерев",
          "ветк",
          "сух",
          "ствол",
          "коряг",
          "сучок",
          "tree",
          "branch",
        ],
      },
      {
        label: "Спящее белое существо",
        stems: [
          "лиц",
          "существ",
          "ресниц",
          "нос",
          "профил",
          "голов",
          "бел",
          "face",
          "creature",
        ],
      },
      {
        label: "Пустынный берег и море",
        stems: [
          "пустын",
          "пляж",
          "берег",
          "песок",
          "мор",
          "вод",
          "desert",
          "beach",
          "sea",
        ],
      },
      {
        label: "Золотистые скалы вдали",
        stems: [
          "скал",
          "гор",
          "мыт",
          "золот",
          "желт",
          "освещен",
          "cliff",
          "rocks",
          "golden",
        ],
      },
    ],
    gridHSV: [
      [205, 0.35, 0.72],
      [210, 0.4, 0.75],
      [42, 0.55, 0.78],
      [44, 0.6, 0.8],
      [38, 0.45, 0.35],
      [200, 0.3, 0.5],
      [205, 0.32, 0.52],
      [42, 0.5, 0.65],
      [35, 0.4, 0.28],
      [40, 0.35, 0.38],
      [42, 0.3, 0.42],
      [38, 0.35, 0.3],
      [32, 0.45, 0.22],
      [34, 0.42, 0.24],
      [35, 0.38, 0.25],
      [36, 0.35, 0.2],
    ],
    gridEdges: [
      0.15, 0.2, 0.35, 0.4, 0.55, 0.45, 0.4, 0.3, 0.65, 0.7, 0.6, 0.45, 0.5,
      0.45, 0.4, 0.35,
    ],
  },
];

const state = {
  playerNick: "",
  currentArt: null,
  timeLeft: ROUND_TIME_SECONDS,
  timerHandle: null,
  cooldownInterval: null,
  generatedImageBase64: null,
  cachedDb: [],
};

const screens = {
  start: document.getElementById("screen-start"),
  game: document.getElementById("screen-game"),
  loading: document.getElementById("screen-loading"),
  result: document.getElementById("screen-result"),
  leaderboard: document.getElementById("screen-leaderboard"),
};

const playerNickInput = document.getElementById("player-nick");
const userTip = document.getElementById("user-tip");
const btnStart = document.getElementById("btn-start");

const hudTimer = document.getElementById("hud-timer");
const hudArtTitle = document.getElementById("hud-art-title");
const hudArtEpoch = document.getElementById("hud-art-epoch");
const targetImg = document.getElementById("target-img");
const promptInput = document.getElementById("prompt-input");
const stopwordAlert = document.getElementById("stopword-alert");
const btnSubmitPrompt = document.getElementById("btn-submit-prompt");

const resPilotName = document.getElementById("res-pilot-name");
const resScorePct = document.getElementById("res-score-pct");
const resVerdictText = document.getElementById("res-verdict-text");
const metricColorVal = document.getElementById("metric-color-val");
const metricColorBar = document.getElementById("metric-color-bar");
const metricStructVal = document.getElementById("metric-struct-val");
const metricStructBar = document.getElementById("metric-struct-bar");
const metricEdgeVal = document.getElementById("metric-edge-val");
const metricEdgeBar = document.getElementById("metric-edge-bar");
const detectiveChips = document.getElementById("detective-chips");

const compTargetImg = document.getElementById("comp-target-img");
const compGenImg = document.getElementById("comp-gen-img");
const resPromptText = document.getElementById("res-prompt-text");

const btnAgain = document.getElementById("btn-again");
const btnOpenLb = document.getElementById("btn-open-lb");
const btnShowLb = document.getElementById("btn-show-lb");
const btnLbBack = document.getElementById("btn-lb-back");
const lbBody = document.getElementById("lb-body");
const lbEmpty = document.getElementById("lb-empty");

const btnHelp = document.getElementById("btn-help");
const btnHelpClose = document.getElementById("btn-help-close");
const modalHelp = document.getElementById("modal-help");

function showScreen(name) {
  Object.values(screens).forEach((s) => s && s.classList.remove("active"));
  if (screens[name]) screens[name].classList.add("active");
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function getItemNick(item) {
  if (!item) return "";
  return String(item.handle || item.name || "").trim();
}

function getBaseNick(rawNick) {
  if (!rawNick || typeof rawNick !== "string") return "";
  return (
    rawNick
      .trim()
      .replace(/(_\d+)+$/i, "")
      .trim() || rawNick.trim()
  );
}

function getNextAvailableNick(rawNick, existingList) {
  const base = getBaseNick(rawNick);
  const escapeBase = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapeBase}(_(\\d+))?$`, "i");

  let maxNum = 1;
  let baseFound = false;

  existingList.forEach((item) => {
    const nick = getItemNick(item);
    const match = nick.match(regex);
    if (match) {
      if (!match[2]) baseFound = true;
      else {
        const num = parseInt(match[2], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });

  return !baseFound && maxNum === 1 ? base : `${base}_${maxNum + 1}`;
}

async function fetchLeaderboard() {
  try {
    const res = await fetch("/api/leaderboard");
    if (!res.ok) throw new Error("API offline");
    const text = await res.text();
    state.cachedDb = text && text.trim() ? JSON.parse(text) : [];
  } catch {
    state.cachedDb = JSON.parse(
      localStorage.getItem("art_leaderboard_stable") || "[]",
    );
  }
  return state.cachedDb;
}

async function commitLeaderboard(data) {
  state.cachedDb = data;
  const payload = data.slice(0, 200);
  localStorage.setItem("art_leaderboard_stable", JSON.stringify(payload));
  try {
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("Сервер оффлайн, сохранено в localStorage:", e);
  }
}

async function checkUserStatus() {
  const raw = playerNickInput.value.trim();
  if (!raw) {
    userTip.className = "user-status-tip";
    userTip.textContent = "Никнейм должен быть уникальным";
    return false;
  }

  await fetchLeaderboard();
  const lower = raw.toLowerCase();
  const existing = state.cachedDb.find(
    (e) => getItemNick(e).toLowerCase() === lower,
  );

  if (existing) {
    const nextAvailable = getNextAvailableNick(raw, state.cachedDb);
    userTip.className = "user-status-tip error";
    userTip.innerHTML = `Занят (${existing.score}%). Жми для выбора: <b id="suggested-nick-btn" style="cursor:pointer; text-decoration:underline; color:var(--gold); padding:2px 6px; background:rgba(250,204,21,0.15); border-radius:6px;">${nextAvailable}</b>`;

    const suggestBtn = document.getElementById("suggested-nick-btn");
    if (suggestBtn) {
      suggestBtn.onclick = () => {
        playerNickInput.value = nextAvailable;
        checkUserStatus();
        playerNickInput.focus();
      };
    }
    return false;
  } else {
    userTip.className = "user-status-tip new-user";
    userTip.textContent = "Никнейм свободен! Готов к батлу.";
    return true;
  }
}

playerNickInput.addEventListener("input", checkUserStatus);

btnStart.addEventListener("click", async () => {
  const nick = playerNickInput.value.trim();
  if (!nick) {
    playerNickInput.focus();
    userTip.className = "user-status-tip error";
    userTip.textContent = "Введи никнейм для участия!";
    return;
  }

  const isAvailable = await checkUserStatus();
  if (!isAvailable) {
    playerNickInput.focus();
    return;
  }

  state.playerNick = nick;
  startSingleBattleRound();
});

function startSingleBattleRound() {
  const randIdx = Math.floor(Math.random() * TARGET_ARTWORKS.length);
  state.currentArt = TARGET_ARTWORKS[randIdx];

  targetImg.src = state.currentArt.imageUrl;
  hudArtTitle.textContent = state.currentArt.title;
  hudArtEpoch.textContent = state.currentArt.epoch;

  promptInput.value = "";
  stopwordAlert.classList.add("hidden");

  // Старт с 5-секундным изучением шедевра (защита API от спама)
  btnSubmitPrompt.disabled = true;
  let cooldownLeft = 5;
  btnSubmitPrompt.textContent = `Изучи образец (${cooldownLeft}с)`;

  if (state.cooldownInterval) clearInterval(state.cooldownInterval);
  state.cooldownInterval = setInterval(() => {
    cooldownLeft--;
    if (cooldownLeft > 0) {
      btnSubmitPrompt.textContent = `Изучи образец (${cooldownLeft}с)`;
    } else {
      clearInterval(state.cooldownInterval);
      state.cooldownInterval = null;
      btnSubmitPrompt.textContent = "🚀 Сгенерировать шедевр";
      handlePromptInput();
    }
  }, 1000);

  state.timeLeft = ROUND_TIME_SECONDS;
  hudTimer.textContent = formatTime(state.timeLeft);
  hudTimer.className = "hud-val gold";

  if (state.timerHandle) clearInterval(state.timerHandle);
  state.timerHandle = setInterval(() => {
    state.timeLeft--;
    hudTimer.textContent = formatTime(state.timeLeft);

    if (state.timeLeft <= 20) hudTimer.className = "hud-val accent";

    if (state.timeLeft <= 0) {
      clearInterval(state.timerHandle);
      triggerSingleGeneration();
    }
  }, 1000);

  showScreen("game");
  promptInput.focus();
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findForbiddenWords(text) {
  if (!state.currentArt) return [];
  const lower = text.toLowerCase();
  return state.currentArt.stopWords.filter((phrase) => {
    const esc = escapeRegExp(phrase.toLowerCase());
    const regex = new RegExp(
      `(^|[^a-zA-Zа-яА-ЯёЁ0-9])${esc}(?![a-zA-Zа-яА-ЯёЁ0-9])`,
      "i",
    );
    return regex.test(lower);
  });
}

function getPromptQualityIssue(text) {
  const clean = text.trim();
  if (clean.length === 0) return "Опиши картину словами";
  if (clean.length < 6) return "Слишком коротко — добавь деталей";
  const words = clean.split(/\s+/).filter((w) => w.length > 1);
  if (words.length < 2) return "Назови хотя бы 2-3 объекта или детали";
  if (/(.)\1{4,}/i.test(clean)) return "Убери залипшие символы";
  if (/[бвгджзйклмнпрстфхцчшщbcdfghjklmnpqrstvwxyz]{6,}/i.test(clean))
    return "Опечатка — исправь слова";

  const pureColors = [
    "красн",
    "син",
    "бел",
    "черн",
    "желт",
    "зелен",
    "темн",
    "светл",
    "голуб",
    "оранжев",
    "серый",
    "сер",
    "фиолетов",
    "red",
    "blue",
    "white",
    "black",
    "yellow",
    "green",
    "dark",
  ];
  const allAreColors = words.every((w) => {
    const lw = w.toLowerCase();
    return pureColors.some((c) => lw.startsWith(c));
  });

  if (allAreColors) {
    return "Указаны только цвета! Назови предмет (человек, скала, волна, море, одежда...)";
  }

  return null;
}

function removeForbiddenWord(word) {
  const esc = escapeRegExp(word);
  const regex = new RegExp(
    `(^|[^a-zA-Zа-яА-ЯёЁ0-9])${esc}(?![a-zA-Zа-яА-ЯёЁ0-9])`,
    "gi",
  );
  promptInput.value = promptInput.value
    .replace(regex, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  handlePromptInput();
  promptInput.focus();
}
window.removeForbiddenWord = removeForbiddenWord;

function handlePromptInput() {
  if (state.cooldownInterval) return; // Кнопка под 5-секундным таймером

  const val = promptInput.value;
  const forbidden = findForbiddenWords(val);
  const qualityIssue = getPromptQualityIssue(val);

  if (forbidden.length > 0) {
    const chipsHtml = forbidden
      .map(
        (w) =>
          `<button type="button" class="stopword-chip" onclick="removeForbiddenWord('${w}')">Удалить «${w}» ✕</button>`,
      )
      .join(" ");
    stopwordAlert.innerHTML = `⚠️ <b>Запрещенные слова:</b><br><div class="chips-container">${chipsHtml}</div>`;
    stopwordAlert.classList.remove("hidden");
    stopwordAlert.className = "stopword-warning";
    btnSubmitPrompt.disabled = true;
  } else if (qualityIssue) {
    stopwordAlert.innerHTML = `ℹ️ ${qualityIssue}`;
    stopwordAlert.classList.remove("hidden");
    stopwordAlert.className = "stopword-info";
    btnSubmitPrompt.disabled = true;
  } else {
    stopwordAlert.classList.add("hidden");
    btnSubmitPrompt.disabled = false;
  }
}
promptInput.addEventListener("input", handlePromptInput);

btnSubmitPrompt.addEventListener("click", () => {
  if (btnSubmitPrompt.disabled) return;
  btnSubmitPrompt.disabled = true; // Мгновенный лок от повторных кликов
  if (state.cooldownInterval) clearInterval(state.cooldownInterval);
  if (state.timerHandle) clearInterval(state.timerHandle);
  triggerSingleGeneration();
});

async function triggerSingleGeneration() {
  if (state.cooldownInterval) clearInterval(state.cooldownInterval);
  let prompt = promptInput.value.trim();

  if (state.currentArt) {
    state.currentArt.stopWords.forEach((phrase) => {
      const esc = escapeRegExp(phrase);
      const regex = new RegExp(
        `(^|[^a-zA-Zа-яА-ЯёЁ0-9])${esc}(?![a-zA-Zа-яА-ЯёЁ0-9])`,
        "gi",
      );
      prompt = prompt.replace(regex, "$1");
    });
    prompt = prompt.replace(/\s{2,}/g, " ").trim();
  }

  const fallback = "Historical fine art painting on full surface";
  const finalPrompt = prompt.length >= 6 ? prompt : fallback;

  showScreen("loading");

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: finalPrompt }),
    });

    const data = await res.json();
    state.generatedImageBase64 = data.image;

    finishBattleRound(finalPrompt);
  } catch (err) {
    console.error("Pipeline notice:", err);
    showScreen("game");
  }
}

// ── Компьютерное зрение ───────
function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [Math.round(h), parseFloat(s.toFixed(3)), parseFloat(v.toFixed(3))];
}

function extractVisionFingerprint(imgBase64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const W = 128,
        H = 128;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;

      const gridHSV = [];
      const gridEdges = [];
      const gridLum = [];
      const cellW = 32,
        cellH = 32;

      for (let gy = 0; gy < 4; gy++) {
        for (let gx = 0; gx < 4; gx++) {
          let rSum = 0,
            gSum = 0,
            bSum = 0;
          let edgeEnergy = 0;
          const totalPixels = cellW * cellH;

          for (let y = gy * cellH; y < (gy + 1) * cellH; y++) {
            for (let x = gx * cellW; x < (gx + 1) * cellW; x++) {
              const idx = (y * W + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              rSum += r;
              gSum += g;
              bSum += b;

              if (x > 0 && y > 0) {
                const idxL = (y * W + (x - 1)) * 4;
                const idxU = ((y - 1) * W + x) * 4;
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                const lumL =
                  0.299 * data[idxL] +
                  0.587 * data[idxL + 1] +
                  0.114 * data[idxL + 2];
                const lumU =
                  0.299 * data[idxU] +
                  0.587 * data[idxL + 1] +
                  0.114 * data[idxL + 2];
                edgeEnergy += Math.abs(lum - lumL) + Math.abs(lum - lumU);
              }
            }
          }

          const hsv = rgbToHsv(
            rSum / totalPixels,
            gSum / totalPixels,
            bSum / totalPixels,
          );
          gridHSV.push(hsv);
          gridLum.push(hsv[2]);
          gridEdges.push(Math.min(1.0, edgeEnergy / totalPixels / 40));
        }
      }
      resolve({ gridHSV, gridLum, gridEdges });
    };
    img.onerror = () => resolve(null);
    img.src = imgBase64;
  });
}

function pearsonCorrelation(x, y) {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    d1 = 0,
    d2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    d1 += dx * dx;
    d2 += dy * dy;
  }
  return d1 === 0 || d2 === 0 ? 0 : num / Math.sqrt(d1 * d2);
}

function evaluateSemanticMarkers(prompt, markers) {
  const lowerPrompt = prompt.toLowerCase();

  return markers.map((marker) => {
    const isMatched = marker.stems.some((stem) => {
      const regex = new RegExp(`(^|[^a-zA-Zа-яА-ЯёЁ])${stem}`, "i");
      return regex.test(lowerPrompt);
    });

    return {
      name: marker.label,
      found: isMatched,
    };
  });
}

async function evaluateBattle(prompt) {
  const genFingerprint = await extractVisionFingerprint(
    state.generatedImageBase64,
  );
  const target = state.currentArt;

  if (!genFingerprint) {
    return {
      finalScore: 50,
      colorScore: 50,
      structScore: 50,
      edgeScore: 50,
      markerAnalysis: [],
      foundCount: 0,
    };
  }

  let colorDiffSum = 0;
  for (let i = 0; i < 16; i++) {
    const [h1, s1, v1] = genFingerprint.gridHSV[i];
    const [h2, s2, v2] = target.gridHSV[i];

    let hDiff = Math.abs(h1 - h2);
    if (hDiff > 180) hDiff = 360 - hDiff;
    const normH = hDiff / 180;

    const saturationConfidence = Math.max(0, Math.min(1, (s1 * s2) / 0.06));
    const cellDist =
      normH * saturationConfidence * 0.35 +
      Math.abs(s1 - s2) * 0.3 +
      Math.abs(v1 - v2) * 0.45;
    colorDiffSum += cellDist;
  }
  const colorScore = Math.round(
    Math.max(25, Math.min(99, (1 - (colorDiffSum / 16) * 1.1) * 100)),
  );

  const targetLum = target.gridHSV.map((c) => c[2]);
  const corr = pearsonCorrelation(genFingerprint.gridLum, targetLum);
  const structScore = Math.round(
    Math.max(25, Math.min(99, Math.max(0, corr) * 100)),
  );

  let edgeDiffSum = 0;
  for (let i = 0; i < 16; i++) {
    edgeDiffSum += Math.abs(genFingerprint.gridEdges[i] - target.gridEdges[i]);
  }
  const edgeScore = Math.round(
    Math.max(25, Math.min(99, (1 - (edgeDiffSum / 16) * 1.35) * 100)),
  );

  const markerAnalysis = evaluateSemanticMarkers(prompt, target.markers);
  const foundCount = markerAnalysis.filter((m) => m.found).length;
  const markerScore = Math.round((foundCount / target.markers.length) * 100);

  const finalScore = Math.min(
    98,
    Math.max(
      20,
      Math.round(
        colorScore * 0.3 +
          structScore * 0.3 +
          edgeScore * 0.15 +
          markerScore * 0.25,
      ),
    ),
  );

  return {
    finalScore,
    colorScore,
    structScore,
    edgeScore,
    markerAnalysis,
    foundCount,
  };
}

function composeVerdict(res, targetTitle) {
  const high = Math.max(res.colorScore, res.structScore, res.edgeScore);
  const low = Math.min(res.colorScore, res.structScore, res.edgeScore);

  let praise = "Отличная передача цветов и общего колорита";
  if (high === res.structScore)
    praise = "Идеально выстроенная композиция и ракурс";
  else if (high === res.edgeScore)
    praise = "Точная передача фактуры и контуров";

  let advice = "но можно точнее передать светотень";
  if (low === res.colorScore)
    advice = "но цвета слегка отличаются по температуре";
  else if (low === res.edgeScore)
    advice = "но деталям немного не хватило четкости";

  return `🎯 Полотно <b>«${targetTitle}»</b>: ${praise} (${high}%), ${advice} (${low}%). Угадано ключевых деталей: ${res.foundCount} из ${res.markerAnalysis.length}.`;
}

async function finishBattleRound(finalPrompt) {
  compTargetImg.src = state.currentArt.imageUrl;
  compGenImg.src = state.generatedImageBase64;
  resPilotName.textContent = state.playerNick;
  resPromptText.textContent = finalPrompt;

  const analysis = await evaluateBattle(finalPrompt);

  resScorePct.textContent = `${analysis.finalScore}%`;
  metricColorVal.textContent = `${analysis.colorScore}%`;
  metricColorBar.style.width = `${analysis.colorScore}%`;

  metricStructVal.textContent = `${analysis.structScore}%`;
  metricStructBar.style.width = `${analysis.structScore}%`;

  metricEdgeVal.textContent = `${analysis.edgeScore}%`;
  metricEdgeBar.style.width = `${analysis.edgeScore}%`;

  resVerdictText.innerHTML = composeVerdict(analysis, state.currentArt.title);

  detectiveChips.innerHTML = analysis.markerAnalysis
    .map(
      (m) =>
        `<span class="det-chip ${m.found ? "hit" : "miss"}">${m.found ? "🟢 " : "⚪ "}${m.name}</span>`,
    )
    .join("");

  const list = await fetchLeaderboard();
  list.push({
    handle: state.playerNick,
    score: analysis.finalScore,
    artwork: state.currentArt.title,
    date: new Date().toLocaleDateString("ru-RU"),
  });

  list.sort((a, b) => b.score - a.score);
  await commitLeaderboard(list);

  showScreen("result");
}

function rankSymbol(i) {
  return ["🥇", "🥈", "🥉"][i] ?? i + 1;
}
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function renderLeaderboard() {
  lbBody.innerHTML =
    '<tr><td colspan="5" style="color:var(--muted);padding:24px">Загрузка данных…</td></tr>';
  lbEmpty.classList.add("hidden");
  const rows = await fetchLeaderboard();

  if (!rows || rows.length === 0) {
    lbBody.innerHTML = "";
    lbEmpty.classList.remove("hidden");
    return;
  }
  lbEmpty.classList.add("hidden");

  lbBody.innerHTML = rows
    .map(
      (item, i) => `
    <tr class="${i < 3 ? "rank-" + (i + 1) : ""}">
      <td>${rankSymbol(i)}</td>
      <td><b>${esc(item.handle)}</b></td>
      <td><span class="lb-score">${item.score}%</span></td>
      <td style="color:var(--muted);">${esc(item.artwork || "Картина")}</td>
      <td style="font-size:0.9rem;color:var(--muted)">${item.date}</td>
    </tr>
  `,
    )
    .join("");
}

async function openLeaderboard() {
  showScreen("leaderboard");
  await renderLeaderboard();
}

btnAgain.addEventListener("click", () => {
  playerNickInput.value = "";
  checkUserStatus();
  showScreen("start");
});

if (btnOpenLb) btnOpenLb.addEventListener("click", openLeaderboard);
btnShowLb.addEventListener("click", openLeaderboard);
btnLbBack.addEventListener("click", () => showScreen("start"));

btnHelp.addEventListener("click", () => modalHelp.classList.remove("hidden"));
btnHelpClose.addEventListener("click", () => modalHelp.classList.add("hidden"));
modalHelp.addEventListener("click", (e) => {
  if (e.target === modalHelp) modalHelp.classList.add("hidden");
});

fetchLeaderboard();