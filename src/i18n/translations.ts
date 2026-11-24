import {
  AnimalKey,
  DayPhaseKey,
  HudElementId,
  HudNearbyPrompt,
  HudObjective,
  HudTip,
  HudToast,
  InventoryCategory,
  InventoryItemId,
  LanguageCode,
  VisualQuality,
  WeatherKey,
  ZoneId,
} from '../game/types';

export const LANGUAGE_CODES: LanguageCode[] = ['pt-BR', 'en', 'es', 'zh', 'ja', 'ar'];

export interface TranslationDict {
  gameTitle: string;
  titleEyebrow: string;
  titleSubtitle: string;
  playBtn: string;
  settingsBtn: string;
  fullscreenEnter: string;
  fullscreenExit: string;
  welcomeLine: string;
  controlsFooter: string;
  system: {
    canvasAria: string;
    webglNoticeTitle: string;
    webglErrorMsg: string;
    fsExitUnsupported: string;
    fsUnsupported: string;
    fsBlocked: string;
  };
  settings: {
    title: string;
    menuBack: string;
    closeAria: string;
    languagesBtn: string;
    languagesHint: string;
    languagesTitle: string;
    languagesDesc: string;
    backToSettings: string;
    languageOptions: Record<LanguageCode, string>;
    cameraSensitivity: string;
    jungleAudio: string;
    muteAll: string;
    mutedAll: string;
    ambientSound: string;
    sfxSound: string;
    mutedShort: string;
    invertY: string;
    invertYDesc: string;
    enabled: string;
    disabled: string;
    graphicsSection: string;
    graphicsQuality: string;
    graphicsQualityDesc: string;
    qualities: Record<VisualQuality, string>;
    atmosphereLabel: string;
    atmosphereDesc: string;
    fpsLimit: string;
    fpsUnlimited: string;
    fpsCounter: string;
    fpsCounterDesc: string;
    fullscreenLabel: string;
    fullscreenDesc: string;
    fullscreenActivate: string;
    fullscreenExitShort: string;
    hudSection: string;
    hudDragDesc: string;
    editHudBtn: string;
    hudScale: string;
    hudOpacity: string;
    hudQuickPos: string;
    hudTopLeft: string;
    hudBottomLeft: string;
    showCompass: string;
    showCompassDesc: string;
    showTips: string;
    showTipsDesc: string;
    touchControls: string;
    touchAuto: string;
    touchAlways: string;
    touchHidden: string;
    backToMenuBtn: string;
    closeBtn: string;
  };
  hud: {
    relics: string;
    landmarks: string;
    agility: string;
    sword: string;
    axe: string;
    attack: string;
    eatBerries: string;
    eatBerriesTitle: string;
    jump: string;
    interactAria: string;
    attackAria: string;
    lightTorch: string;
    lightFlashlight: string;
    lightTurnOnAria: string;
    lightTurnOffAria: string;
    inventoryBtn: string;
    inventoryAria: string;
    camera1stAria: string;
    camera3rdAria: string;
    pauseBtn: string;
    pauseAria: string;
    muteAria: string;
    unmuteAria: string;
    fullscreenAria: string;
    exitFullscreenAria: string;
    fpsSuffix: string;
    tipLocked: string;
    tipUnlocked: string;
    predatorChase: string;
    predatorStalk: string;
    objectivePrefix: string;
    stamina: string;
    staminaExhausted: string;
    food: string;
    foodLow: string;
    swimming: string;
    interactGuide: string;
    interactGuideSub: string;
    lieDown: string;
    sleepNightOnly: string;
    sleepingTitle: string;
    sleepingDesc: string;
    treeTarget: string;
    rockTarget: string;
  };
  hudEditor: {
    editing: string;
    dragHint: string;
    scale: string;
    opacity: string;
    resetDefault: string;
    cancel: string;
    save: string;
    labels: Record<HudElementId, string>;
    previewStatusZone: string;
    previewCompass: string;
    previewJump: string;
    previewCollect: string;
    previewTips: string;
  };
  inventory: {
    title: string;
    subtitle: string;
    closeAria: string;
    emptySlot: string;
    inUse: string;
    quantityInBag: string;
    lightStatus: string;
    lightOn: string;
    lightOff: string;
    selectPrompt: string;
    useItem: string;
    equip: string;
    unequip: string;
    backToExplore: string;
    craftTorchTitle: string;
    craftBandageTitle: string;
    craftCampfireTitle: string;
    craftTorchBtn: string;
    craftBandageBtn: string;
    craftCampfireBtn: string;
    woodShort: string;
    stoneShort: string;
    herbShort: string;
    ropeShort: string;
    categories: Record<InventoryCategory, string>;
    items: Record<InventoryItemId, { name: string; description: string }>;
  };
  pauseVictory: {
    victoryTitle: string;
    victoryDesc: string;
    fallenTitle: string;
    fallenDesc: string;
    pauseTitle: string;
    pauseDesc: string;
    relics: string;
    landmarks: string;
    time: string;
    respawnBtn: string;
    resumeVictoryBtn: string;
    resumeBtn: string;
    settingsBtn: string;
    restartBtn: string;
    backToTitleBtn: string;
  };
  zones: Record<ZoneId, string>;
  dayPhases: Record<DayPhaseKey, string>;
  weather: Record<WeatherKey, string>;
  animals: Record<AnimalKey, string>;
  relics: Record<string, { title: string; subtitle: string }>;
  landmarks: Record<string, { title: string; subtitle: string }>;
  guide: {
    speaker: string;
    badge: string;
    stepOf: string;
    next: string;
    startExplore: string;
    pages: Array<{ title: string; body: string }>;
  };
}

const PT_BR: TranslationDict = {
  gameTitle: 'Ecos da Selva',
  titleEyebrow: 'Exploração Tropical em 3D',
  titleSubtitle:
    'Percorra trilhas antigas sob a copa densa, desbrave clareiras iluminadas pelo sol e recupere relíquias perdidas.',
  playBtn: 'JOGAR',
  settingsBtn: 'CONFIGURAÇÕES',
  fullscreenEnter: 'TELA CHEIA',
  fullscreenExit: 'SAIR DA TELA CHEIA',
  welcomeLine: 'Bem-vindo ao Ecos da Selva!',
  controlsFooter:
    'WASD Mover · Mouse ou Toque Olhar 360° · V Câmera 1ª/3ª · E Interagir · I Inventário · Q Atacar · F Luz',
  system: {
    canvasAria: 'Cenário 3D da selva tropical',
    webglNoticeTitle: 'Aviso Gráfico 3D',
    webglErrorMsg: 'Não foi possível inicializar o contexto WebGL 3D neste navegador.',
    fsExitUnsupported: 'Saída de tela cheia não suportada neste navegador.',
    fsUnsupported: 'Tela cheia não suportada ou bloqueada neste dispositivo.',
    fsBlocked: 'Não foi possível alternar para tela cheia nesta janela.',
  },
  settings: {
    title: 'Configurações',
    menuBack: 'Menu',
    closeAria: 'Fechar configurações',
    languagesBtn: 'Linguagens',
    languagesHint: 'Escolha o idioma do jogo',
    languagesTitle: 'Linguagens',
    languagesDesc: 'Todo o texto do jogo é traduzido imediatamente ao selecionar.',
    backToSettings: 'Voltar às Configurações',
    languageOptions: {
      'pt-BR': 'Português',
      en: 'Inglês',
      es: 'Espanhol',
      zh: 'Chinês',
      ja: 'Japonês',
      ar: 'Árabe',
    },
    cameraSensitivity: 'Sensibilidade da Câmera',
    jungleAudio: 'Áudio da Selva',
    muteAll: 'Silenciar Tudo',
    mutedAll: 'Áudio Silenciado',
    ambientSound: 'Som Ambiente (Mata e Animais)',
    sfxSound: 'Efeitos Sonoros (Passos e Itens)',
    mutedShort: 'Mudo',
    invertY: 'Inverter Eixo Vertical (Y)',
    invertYDesc: 'Inverte o movimento para cima/baixo da câmera',
    enabled: 'Ativado',
    disabled: 'Desativado',
    graphicsSection: 'Desempenho Gráfico e Atmosfera',
    graphicsQuality: 'Qualidade Gráfica',
    graphicsQualityDesc:
      'Mantém toda a vegetação da selva em qualquer nível · Batata: estilo massinha sem sombras/efeitos · High: detalhe máximo',
    qualities: {
      potato: 'Gráfico Batata',
      'ultra-low': 'Low',
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      'ultra-high': 'High',
    },
    atmosphereLabel: 'Atmosfera e Raios de Luz',
    atmosphereDesc: 'Ajusta densidade da névoa e raios solares sem afetar o FPS',
    fpsLimit: 'Limite de FPS',
    fpsUnlimited: 'Ilimitado',
    fpsCounter: 'Contador de FPS',
    fpsCounterDesc: 'Exibe a taxa de quadros no canto da tela',
    fullscreenLabel: 'Tela Cheia',
    fullscreenDesc: 'Alterna exibição em tela cheia no navegador',
    fullscreenActivate: 'Ativar',
    fullscreenExitShort: 'Sair',
    hudSection: 'Personalização do HUD',
    hudDragDesc: 'Arraste botões e painéis livremente pela tela',
    editHudBtn: 'Editar HUD',
    hudScale: 'Tamanho Global do HUD',
    hudOpacity: 'Opacidade dos Painéis',
    hudQuickPos: 'Posição Rápida do Status',
    hudTopLeft: 'Superior Esq.',
    hudBottomLeft: 'Inferior Esq.',
    showCompass: 'Exibir Bússola',
    showCompassDesc: 'Mostra direção das relíquias no topo',
    showTips: 'Exibir Dicas na Tela',
    showTipsDesc: 'Mostra orientações contextuais e atalhos',
    touchControls: 'Controles na Tela (Toque)',
    touchAuto: 'Automático',
    touchAlways: 'Visível',
    touchHidden: 'Oculto',
    backToMenuBtn: 'Voltar ao Menu',
    closeBtn: 'Fechar',
  },
  hud: {
    relics: 'Relíquias',
    landmarks: 'Marcos',
    agility: 'Agilidade',
    sword: 'Espada',
    axe: 'Machado',
    attack: 'Atacar',
    eatBerries: 'Comer Bagas',
    eatBerriesTitle: 'Comer Bagas Doces (+18 Vida e Energia)',
    jump: 'Pular',
    interactAria: 'Interagir',
    attackAria: 'Atacar',
    lightTorch: 'Tocha',
    lightFlashlight: 'Lanterna',
    lightTurnOnAria: 'Ligar luz (F)',
    lightTurnOffAria: 'Desligar luz (F)',
    inventoryBtn: 'Inventário',
    inventoryAria: 'Abrir inventário (I)',
    camera1stAria: 'Mudar para câmera em 3ª pessoa (V)',
    camera3rdAria: 'Mudar para câmera em 1ª pessoa (V)',
    pauseBtn: 'Pausar',
    pauseAria: 'Pausar jogo',
    muteAria: 'Silenciar som',
    unmuteAria: 'Ativar som',
    fullscreenAria: 'Tela cheia',
    exitFullscreenAria: 'Sair da tela cheia',
    fpsSuffix: 'FPS',
    tipLocked: 'Mouse livre 360° · Clique/Q Atacar · V Câmera 1ª/3ª · Esc Pausar',
    tipUnlocked: 'Arraste para girar 360° · Scroll/V Câmera 1ª/3ª · Shift correr · Q atacar',
    predatorChase: 'Predador perseguindo! Corra (Shift), entre numa cabana ou ataque (Q).',
    predatorStalk: 'Predador noturno à espreita na mata!',
    objectivePrefix: 'Objetivo',
    stamina: 'Estamina',
    staminaExhausted: 'Esgotada',
    food: 'Alimento',
    foodLow: 'Fome',
    swimming: 'Nadando',
    interactGuide: 'Falar com o Guia',
    interactGuideSub: 'Instruções iniciais obrigatórias',
    lieDown: 'Deitar',
    sleepNightOnly: 'Só à noite',
    sleepingTitle: 'Descansando até o amanhecer...',
    sleepingDesc: 'Recuperando forças enquanto a noite passa na selva.',
    treeTarget: 'Árvore da Selva',
    rockTarget: 'Rocha da Mata',
  },
  hudEditor: {
    editing: 'Editando',
    dragHint: 'Arraste qualquer painel ou botão pela tela',
    scale: 'Tamanho',
    opacity: 'Opacidade',
    resetDefault: 'Restaurar padrão',
    cancel: 'Cancelar',
    save: 'Salvar',
    labels: {
      status: 'Status, Vida e Estamina',
      compass: 'Bússola',
      toolbar: 'Barra Superior',
      fps: 'Contador FPS',
      joystick: 'Joystick',
      actions: 'Botões de Ação',
      interact: 'Botão Coletar (E)',
      tips: 'Dicas de Controle',
    },
    previewStatusZone: 'Clareira do Sol · Dia · Céu Limpo',
    previewCompass: 'Bússola',
    previewJump: 'Pular',
    previewCollect: 'Coletar Item',
    previewTips: 'Arraste para girar 360° · Q atacar · V câmera',
  },
  inventory: {
    title: 'Mochila de Exploração',
    subtitle: 'Gerencie equipamentos, consumíveis, fogueiras e recursos coletados',
    closeAria: 'Fechar inventário',
    emptySlot: 'Vazio',
    inUse: 'Em uso',
    quantityInBag: 'Quantidade na mochila',
    lightStatus: 'Luz atual',
    lightOn: 'Acesa (Pressione F para apagar)',
    lightOff: 'Apagada (Pressione F para acender)',
    selectPrompt: 'Selecione um item na grade para visualizar detalhes e ações.',
    useItem: 'Usar Item',
    equip: 'Equipar',
    unequip: 'Desequipar',
    backToExplore: 'Voltar à Exploração (I / Esc)',
    craftTorchTitle: 'Montar Tocha da Selva',
    craftBandageTitle: 'Atadura Medicinal (+35 Vida)',
    craftCampfireTitle: 'Montar Fogueira na Mata',
    craftTorchBtn: 'Montar',
    craftBandageBtn: 'Aplicar',
    craftCampfireBtn: 'Montar',
    woodShort: 'Madeira',
    stoneShort: 'Pedra',
    herbShort: 'Erva',
    ropeShort: 'Corda',
    categories: {
      Equipamento: 'Equipamento',
      Arma: 'Arma',
      Consumível: 'Consumível',
      Recurso: 'Recurso',
    },
    items: {
      lantern: {
        name: 'Lanterna de Expedição',
        description: 'Ilumina trilhas escuras durante a noite na selva. Pressione F para ligar ou desligar.',
      },
      torch: {
        name: 'Tocha da Selva',
        description: 'Tocha artesanal de chama quente. Pode ser feita com 2 Madeiras Firmes e 1 Pedra de Sílex.',
      },
      compass: {
        name: 'Bússola de Latão',
        description: 'Instrumento de navegação que orienta o explorador rumo às relíquias e marcos.',
      },
      axe: {
        name: 'Machado de Exploração',
        description: 'Ferramenta robusta de aço. Equipe para se defender com golpes pesados (tecla Q).',
      },
      sword: {
        name: 'Espada da Selva',
        description: 'Lâmina longa e equilibrada ideal para afugentar predadores noturnos rapidamente (tecla Q).',
      },
      medkit: {
        name: 'Kit Médico',
        description: 'Bandagens e antissépticos de campo. Ao usar, restaura 45 pontos de vida imediatamente.',
      },
      rations: {
        name: 'Comida e Água',
        description: 'Cantil de água fresca e provisões secas. Restaura 25 de vida e dá agilidade por 14 segundos.',
      },
      raw_meat: {
        name: 'Carne Crua',
        description: 'Carne fresca obtida ao abater animais. Monte uma fogueira para assar ou use crua (+30 Vida).',
      },
      cooked_meat: {
        name: 'Carne Assada',
        description: 'Carne preparada na brasa da fogueira. Restaura 55 pontos de vida e dá energia por 20 segundos.',
      },
      sweet_berry: {
        name: 'Bagas Doces',
        description: 'Bagas silvestres suculentas colhidas em moitas da selva. Restaura 18 de vida e dá energia por 12 segundos.',
      },
      fruit: {
        name: 'Fruta Tropical',
        description: 'Fruto doce e hidratante da mata. Restaura 12 de vida e aumenta a agilidade por 14 segundos.',
      },
      herb: {
        name: 'Erva da Clareira',
        description: 'Folha medicinal aromática. Restaura 18 de vida e concede fôlego extra por 10 segundos.',
      },
      rope: {
        name: 'Corda Resistente',
        description: 'Corda trançada de fibra natural. Combine com 1 Erva da Clareira para criar uma Atadura (+35 Vida).',
      },
      wood: {
        name: 'Madeira Firme',
        description: 'Galhos secos e resistentes recolhidos na mata. Úteis para montar tocha ou fogueira.',
      },
      stone: {
        name: 'Pedra de Sílex',
        description: 'Pedra lisa de leito de rio capaz de gerar faíscas para acender tochas e fogueiras.',
      },
    },
  },
  pauseVictory: {
    victoryTitle: 'Expedição Concluída!',
    victoryDesc: 'Você explorou todas as clareiras e reuniu todas as relíquias da selva.',
    fallenTitle: 'Você foi ferido na selva',
    fallenDesc: 'Os predadores noturnos atacaram você na mata. Retorne à Clareira do Sol ou recomece.',
    pauseTitle: 'Jogo Pausado',
    pauseDesc: 'A exploração está em espera. Retome quando estiver pronto.',
    relics: 'Relíquias',
    landmarks: 'Marcos',
    time: 'Tempo',
    respawnBtn: 'Levantar na Clareira',
    resumeVictoryBtn: 'Continuar Explorando Livremente',
    resumeBtn: 'Continuar',
    settingsBtn: 'Configurações',
    restartBtn: 'Reiniciar Expedição',
    backToTitleBtn: 'Voltar ao Menu Inicial',
  },
  zones: {
    'cabin-trail': 'Cabana da Trilha',
    'cabin-stream': 'Abrigo do Riacho',
    'cabin-north': 'Posto da Mata Alta',
    'cabin-cedars': 'Cabana dos Cedros',
    'cabin-abandoned': 'Refúgio Abandonado',
    'cabin-forester': 'Casa do Mateiro',
    'village-nascente': 'Aldeia da Nascente',
    'village-vale': 'Vila do Vale Verde',
    'village-norte': 'Povoado do Norte',
    central: 'Clareira do Sol',
    ruins: 'Altar das Ruínas',
    overlook: 'Mirante da Pedra Alta',
    stream: 'Riacho Esmeralda',
    palms: 'Bosque das Palmeiras',
    grove: 'Santuário da Raiz',
    trail: 'Trilha da Mata',
    dense_jungle: 'Selva Densa',
  },
  dayPhases: {
    dawn: 'Amanhecer',
    day: 'Dia',
    dusk: 'Entardecer',
    night: 'Noite',
  },
  weather: {
    clear: 'Céu Limpo',
    starry: 'Céu Estrelado',
    mist: 'Névoa Úmida',
    light_rain: 'Chuva Leve',
    storm: 'Tempestade',
  },
  animals: {
    deer: 'Cervo da Mata',
    capybara: 'Capivara',
    macaw: 'Arara-Vermelha',
    jaguar: 'Onça-Pintada',
    panther: 'Pantera Negra',
  },
  relics: {
    'relic-sun': {
      title: 'Relíquia do Sol Nascente',
      subtitle: 'Amuleto dourado deixado junto à clareira inicial',
    },
    'relic-jaguar': {
      title: 'Ídolo do Jaguar',
      subtitle: 'Escultura antiga guardada no altar de pedra',
    },
    'relic-orchid': {
      title: 'Orquídea Dourada',
      subtitle: 'Flor luminosa rara que cresce no mirante elevado',
    },
    'relic-crystal': {
      title: 'Cristal da Nascente',
      subtitle: 'Quartzo esmeralda polido pelas águas do riacho',
    },
    'relic-root': {
      title: 'Totem das Raízes',
      subtitle: 'Talismã talhado na madeira do santuário sul',
    },
  },
  landmarks: {
    'landmark-ruins': {
      title: 'Altar das Ruínas',
      subtitle: 'Monólito ancestral tomado por musgos e cipós',
    },
    'landmark-overlook': {
      title: 'Mirante da Pedra Alta',
      subtitle: 'Platô rochoso com vista aberta sobre a copa das árvores',
    },
    'landmark-stream': {
      title: 'Nascente Esmeralda',
      subtitle: 'Lagoa cristalina cercada por samambaias e pedras lisas',
    },
  },
  guide: {
    speaker: 'Mateiro Kauã',
    badge: 'Guia da Clareira',
    stepOf: 'Etapa',
    next: 'Continuar',
    startExplore: 'Iniciar Exploração',
    pages: [
      {
        title: 'Controles e Exploração',
        body: 'Use WASD (ou o joystick na tela) para caminhar pelas trilhas, montanhas, rios e aldeias. Segure Shift para correr consumindo estamina de 10 em 10, Espaço para pular ou nadar nos rios, e V para alternar entre câmera em 1ª e 3ª pessoa.',
      },
      {
        title: 'Coleta de Recursos e Caça',
        body: 'Colete madeiras, pedras, bagas, frutas e ervas com E ou abra caixas de suprimentos nas aldeias. Equipe Machado ou Espada no Inventário (I) e ataque com Q ou clique para derrubar árvores (3 madeiras), quebrar rochas (3 pedras) e caçar animais.',
      },
      {
        title: 'Vida, Estamina e Alimento',
        body: 'Fique atento às 3 barras de sobrevivência: Vida, Estamina (recupera de 20 em 20 ao descansar) e Alimento. Sua barra de alimento cai 20 pontos a cada 2 minutos — coma bagas (R), frutas, rações ou carne antes que chegue a zero!',
      },
      {
        title: 'Fogueiras, Luz e Relíquias',
        body: 'Monte fogueiras pelo Inventário (I) usando madeiras e pedras para iluminar a noite e assar Carne Crua (E) em Carne Assada. Ao cair da noite, acenda sua lanterna ou tocha com F e siga a bússola no topo para reunir as 5 relíquias.',
      },
    ],
  },
};

const EN: TranslationDict = {
  gameTitle: 'Echoes of the Jungle',
  titleEyebrow: '3D Tropical Exploration',
  titleSubtitle:
    'Walk ancient trails beneath the dense canopy, brave sunlit clearings, and recover lost relics.',
  playBtn: 'PLAY',
  settingsBtn: 'SETTINGS',
  fullscreenEnter: 'FULLSCREEN',
  fullscreenExit: 'EXIT FULLSCREEN',
  welcomeLine: 'Welcome to Echoes of the Jungle!',
  controlsFooter:
    'WASD Move · Mouse or Touch Look 360° · V 1st/3rd Camera · E Interact · I Inventory · Q Attack · F Light',
  system: {
    canvasAria: '3D tropical jungle world',
    webglNoticeTitle: '3D Graphics Notice',
    webglErrorMsg: 'Could not initialize a 3D WebGL context in this browser.',
    fsExitUnsupported: 'Exiting fullscreen is not supported in this browser.',
    fsUnsupported: 'Fullscreen is not supported or blocked on this device.',
    fsBlocked: 'Unable to toggle fullscreen inside this window.',
  },
  settings: {
    title: 'Settings',
    menuBack: 'Menu',
    closeAria: 'Close settings',
    languagesBtn: 'Languages',
    languagesHint: 'Choose the game language',
    languagesTitle: 'Languages',
    languagesDesc: 'All game text translates immediately when selected.',
    backToSettings: 'Back to Settings',
    languageOptions: {
      'pt-BR': 'Portuguese',
      en: 'English',
      es: 'Spanish',
      zh: 'Chinese',
      ja: 'Japanese',
      ar: 'Arabic',
    },
    cameraSensitivity: 'Camera Sensitivity',
    jungleAudio: 'Jungle Audio',
    muteAll: 'Mute All',
    mutedAll: 'Audio Muted',
    ambientSound: 'Ambient Sound (Forest & Wildlife)',
    sfxSound: 'Sound Effects (Steps & Items)',
    mutedShort: 'Muted',
    invertY: 'Invert Vertical Axis (Y)',
    invertYDesc: 'Inverts up/down camera movement',
    enabled: 'Enabled',
    disabled: 'Disabled',
    graphicsSection: 'Graphics Performance & Atmosphere',
    graphicsQuality: 'Graphics Quality',
    graphicsQualityDesc:
      'Keeps full jungle vegetation at every tier · Potato: flat clay style without shadows/effects · High: max detail',
    qualities: {
      potato: 'Potato Mode',
      'ultra-low': 'Low',
      low: 'Lower',
      medium: 'Medium',
      high: 'High',
      'ultra-high': 'Ultra High',
    },
    atmosphereLabel: 'Atmosphere & Sunbeams',
    atmosphereDesc: 'Adjusts fog density and light shafts without hurting FPS',
    fpsLimit: 'FPS Limit',
    fpsUnlimited: 'Unlimited',
    fpsCounter: 'FPS Counter',
    fpsCounterDesc: 'Displays frame rate in the corner of the screen',
    fullscreenLabel: 'Fullscreen',
    fullscreenDesc: 'Toggles browser fullscreen display',
    fullscreenActivate: 'Enable',
    fullscreenExitShort: 'Exit',
    hudSection: 'HUD Customization',
    hudDragDesc: 'Drag panels and buttons freely across the screen',
    editHudBtn: 'Edit HUD',
    hudScale: 'Global HUD Scale',
    hudOpacity: 'Panel Opacity',
    hudQuickPos: 'Quick Status Position',
    hudTopLeft: 'Top Left',
    hudBottomLeft: 'Bottom Left',
    showCompass: 'Show Compass',
    showCompassDesc: 'Shows direction to relics at the top',
    showTips: 'Show On-Screen Tips',
    showTipsDesc: 'Displays contextual hints and shortcuts',
    touchControls: 'On-Screen Touch Controls',
    touchAuto: 'Auto',
    touchAlways: 'Visible',
    touchHidden: 'Hidden',
    backToMenuBtn: 'Back to Menu',
    closeBtn: 'Close',
  },
  hud: {
    relics: 'Relics',
    landmarks: 'Landmarks',
    agility: 'Agility',
    sword: 'Sword',
    axe: 'Axe',
    attack: 'Attack',
    eatBerries: 'Eat Berries',
    eatBerriesTitle: 'Eat Sweet Berries (+18 HP & Energy)',
    jump: 'Jump',
    interactAria: 'Interact',
    attackAria: 'Attack',
    lightTorch: 'Torch',
    lightFlashlight: 'Flashlight',
    lightTurnOnAria: 'Turn light on (F)',
    lightTurnOffAria: 'Turn light off (F)',
    inventoryBtn: 'Inventory',
    inventoryAria: 'Open inventory (I)',
    camera1stAria: 'Switch to 3rd person camera (V)',
    camera3rdAria: 'Switch to 1st person camera (V)',
    pauseBtn: 'Pause',
    pauseAria: 'Pause game',
    muteAria: 'Mute audio',
    unmuteAria: 'Unmute audio',
    fullscreenAria: 'Fullscreen',
    exitFullscreenAria: 'Exit fullscreen',
    fpsSuffix: 'FPS',
    tipLocked: 'Free look 360° · Click/Q Attack · V 1st/3rd Camera · Esc Pause',
    tipUnlocked: 'Drag to look 360° · Scroll/V 1st/3rd Camera · Shift sprint · Q attack',
    predatorChase: 'Predator chasing! Sprint (Shift), shelter in a cabin, or attack (Q).',
    predatorStalk: 'Night predator stalking nearby!',
    objectivePrefix: 'Objective',
    stamina: 'Stamina',
    staminaExhausted: 'Exhausted',
    food: 'Food',
    foodLow: 'Hungry',
    swimming: 'Swimming',
    interactGuide: 'Talk to Guide',
    interactGuideSub: 'Required starting briefing',
    lieDown: 'Lie Down',
    sleepNightOnly: 'Night only',
    sleepingTitle: 'Resting until dawn...',
    sleepingDesc: 'Recovering strength as the jungle night passes.',
    treeTarget: 'Jungle Tree',
    rockTarget: 'Jungle Boulder',
  },
  hudEditor: {
    editing: 'Editing',
    dragHint: 'Drag any panel or button across the screen',
    scale: 'Size',
    opacity: 'Opacity',
    resetDefault: 'Reset Default',
    cancel: 'Cancel',
    save: 'Save',
    labels: {
      status: 'Status, HP & Stamina',
      compass: 'Compass',
      toolbar: 'Top Toolbar',
      fps: 'FPS Counter',
      joystick: 'Joystick',
      actions: 'Action Buttons',
      interact: 'Interact Button (E)',
      tips: 'Control Tips',
    },
    previewStatusZone: 'Sun Clearing · Day · Clear Sky',
    previewCompass: 'Compass',
    previewJump: 'Jump',
    previewCollect: 'Collect Item',
    previewTips: 'Drag to look 360° · Q attack · V camera',
  },
  inventory: {
    title: 'Exploration Backpack',
    subtitle: 'Manage gear, consumables, campfires, and gathered resources',
    closeAria: 'Close inventory',
    emptySlot: 'Empty',
    inUse: 'Equipped',
    quantityInBag: 'Quantity in backpack',
    lightStatus: 'Light status',
    lightOn: 'On (Press F to turn off)',
    lightOff: 'Off (Press F to turn on)',
    selectPrompt: 'Select an item in the grid to view details and actions.',
    useItem: 'Use Item',
    equip: 'Equip',
    unequip: 'Unequip',
    backToExplore: 'Return to Exploration (I / Esc)',
    craftTorchTitle: 'Craft Jungle Torch',
    craftBandageTitle: 'Herbal Bandage (+35 HP)',
    craftCampfireTitle: 'Build Jungle Campfire',
    craftTorchBtn: 'Craft',
    craftBandageBtn: 'Apply',
    craftCampfireBtn: 'Build',
    woodShort: 'Wood',
    stoneShort: 'Stone',
    herbShort: 'Herb',
    ropeShort: 'Rope',
    categories: {
      Equipamento: 'Gear',
      Arma: 'Weapon',
      Consumível: 'Consumable',
      Recurso: 'Resource',
    },
    items: {
      lantern: {
        name: 'Expedition Flashlight',
        description: 'Illuminates dark trails during jungle nights. Press F to toggle on or off.',
      },
      torch: {
        name: 'Jungle Torch',
        description: 'Handcrafted warm-flame torch. Can be crafted with 2 Sturdy Wood and 1 Flint Stone.',
      },
      compass: {
        name: 'Brass Compass',
        description: 'Navigation instrument guiding the explorer toward lost relics and landmarks.',
      },
      axe: {
        name: 'Explorer Axe',
        description: 'Heavy steel tool. Equip to defend yourself with strong strikes (Q key).',
      },
      sword: {
        name: 'Jungle Sword',
        description: 'Balanced long blade ideal for fending off night predators swiftly (Q key).',
      },
      medkit: {
        name: 'Medkit',
        description: 'Field bandages and antiseptic. Restores 45 HP immediately when used.',
      },
      rations: {
        name: 'Food & Water',
        description: 'Fresh canteen and dry rations. Restores 25 HP and boosts agility for 14 seconds.',
      },
      raw_meat: {
        name: 'Raw Meat',
        description: 'Fresh meat hunted in the jungle. Build a campfire to roast it or eat raw (+30 HP).',
      },
      cooked_meat: {
        name: 'Roasted Meat',
        description: 'Savory meat cooked over campfire embers. Restores 55 HP and grants 20s energy.',
      },
      sweet_berry: {
        name: 'Sweet Berries',
        description: 'Juicy wild berries picked from jungle bushes. Restores 18 HP and 12s energy.',
      },
      fruit: {
        name: 'Tropical Fruit',
        description: 'Sweet hydrating forest fruit. Restores 12 HP and boosts agility for 14 seconds.',
      },
      herb: {
        name: 'Clearing Herb',
        description: 'Aromatic medicinal leaf. Restores 18 HP and grants extra stamina for 10 seconds.',
      },
      rope: {
        name: 'Sturdy Rope',
        description: 'Braided natural fiber rope. Combine with 1 Clearing Herb to apply a Bandage (+35 HP).',
      },
      wood: {
        name: 'Sturdy Wood',
        description: 'Dry hardwood branches found in the forest. Used to build torches and campfires.',
      },
      stone: {
        name: 'Flint Stone',
        description: 'Smooth river stone able to strike sparks for lighting torches and campfires.',
      },
    },
  },
  pauseVictory: {
    victoryTitle: 'Expedition Complete!',
    victoryDesc: 'You explored every clearing and gathered all ancient relics of the jungle.',
    fallenTitle: 'You were injured in the jungle',
    fallenDesc: 'Night predators struck you in the woods. Recover at Sun Clearing or restart.',
    pauseTitle: 'Game Paused',
    pauseDesc: 'Exploration is on hold. Resume whenever you are ready.',
    relics: 'Relics',
    landmarks: 'Landmarks',
    time: 'Time',
    respawnBtn: 'Recover at Clearing',
    resumeVictoryBtn: 'Keep Exploring Freely',
    resumeBtn: 'Resume',
    settingsBtn: 'Settings',
    restartBtn: 'Restart Expedition',
    backToTitleBtn: 'Back to Main Menu',
  },
  zones: {
    'cabin-trail': 'Trail Cabin',
    'cabin-stream': 'Stream Shelter',
    'cabin-north': 'Highland Outpost',
    'cabin-cedars': 'Cedar Cabin',
    'cabin-abandoned': 'Abandoned Refuge',
    'cabin-forester': "Forester's House",
    'village-nascente': 'Spring Village',
    'village-vale': 'Green Valley Hamlet',
    'village-norte': 'Northern Settlement',
    central: 'Sun Clearing',
    ruins: 'Ruins Altar',
    overlook: 'High Rock Overlook',
    stream: 'Emerald Stream',
    palms: 'Palm Grove',
    grove: 'Root Sanctuary',
    trail: 'Forest Trail',
    dense_jungle: 'Dense Jungle',
  },
  dayPhases: {
    dawn: 'Dawn',
    day: 'Day',
    dusk: 'Dusk',
    night: 'Night',
  },
  weather: {
    clear: 'Clear Sky',
    starry: 'Starry Night',
    mist: 'Humid Mist',
    light_rain: 'Light Rain',
    storm: 'Storm',
  },
  animals: {
    deer: 'Forest Deer',
    capybara: 'Capybara',
    macaw: 'Scarlet Macaw',
    jaguar: 'Jaguar',
    panther: 'Black Panther',
  },
  relics: {
    'relic-sun': {
      title: 'Rising Sun Relic',
      subtitle: 'Golden amulet left beside the starting clearing',
    },
    'relic-jaguar': {
      title: 'Jaguar Idol',
      subtitle: 'Ancient carving guarded at the stone altar',
    },
    'relic-orchid': {
      title: 'Golden Orchid',
      subtitle: 'Rare luminous blossom growing on the high overlook',
    },
    'relic-crystal': {
      title: 'Spring Crystal',
      subtitle: 'Emerald quartz polished by the stream waters',
    },
    'relic-root': {
      title: 'Totem of Roots',
      subtitle: 'Talisman carved into the wood of the southern sanctuary',
    },
  },
  landmarks: {
    'landmark-ruins': {
      title: 'Ruins Altar',
      subtitle: 'Ancient monolith overgrown with moss and vines',
    },
    'landmark-overlook': {
      title: 'High Rock Overlook',
      subtitle: 'Rocky plateau with an open view over the canopy',
    },
    'landmark-stream': {
      title: 'Emerald Spring',
      subtitle: 'Crystal lagoon surrounded by ferns and smooth stones',
    },
  },
  guide: {
    speaker: 'Ranger Kauã',
    badge: 'Clearing Guide',
    stepOf: 'Step',
    next: 'Continue',
    startExplore: 'Start Exploring',
    pages: [
      {
        title: 'Controls & Exploration',
        body: 'Use WASD (or the on-screen joystick) to traverse trails, mountains, rivers, and scattered villages. Hold Shift to sprint (draining stamina in steps of 10), Space to jump or swim across rivers, and V to toggle between 1st and 3rd person cameras.',
      },
      {
        title: 'Gathering & Hunting',
        body: 'Collect wood, stones, berries, and supply crates in villages with E. Equip your Axe or Sword in the Inventory (I) and strike with Q or click to fell trees (3 wood), shatter rocks (3 flint), and hunt wildlife for meat.',
      },
      {
        title: 'Health, Stamina & Food',
        body: 'Watch all three survival bars: Health, Stamina (recovers in steps of 20 when resting), and Food. Your Food bar drops 20 points every 2 minutes — eat berries (R), fruit, rations, or meat before hunger drains your health!',
      },
      {
        title: 'Campfires, Light & Relics',
        body: 'Craft a campfire in your Inventory (I) using wood and stone to illuminate the night and roast Raw Meat (E) into Roasted Meat. Press F to toggle your flashlight or torch at night and follow the compass to recover all 5 relics.',
      },
    ],
  },
};

const ES: TranslationDict = {
  gameTitle: 'Ecos de la Selva',
  titleEyebrow: 'Exploración Tropical en 3D',
  titleSubtitle:
    'Recorre senderos antiguos bajo la densa copa, explora claros bañados por el sol y recupera reliquias perdidas.',
  playBtn: 'JUGAR',
  settingsBtn: 'CONFIGURACIÓN',
  fullscreenEnter: 'PANTALLA COMPLETA',
  fullscreenExit: 'SALIR DE PANTALLA COMPLETA',
  welcomeLine: '¡Bienvenido a Ecos de la Selva!',
  controlsFooter:
    'WASD Mover · Ratón o Toque Mirar 360° · V Cámara 1ª/3ª · E Interactuar · I Inventario · Q Atacar · F Luz',
  system: {
    canvasAria: 'Escenario 3D de la selva tropical',
    webglNoticeTitle: 'Aviso Gráfico 3D',
    webglErrorMsg: 'No se pudo inicializar el contexto WebGL 3D en este navegador.',
    fsExitUnsupported: 'Salir de pantalla completa no es compatible con este navegador.',
    fsUnsupported: 'Pantalla completa no compatible o bloqueada en este dispositivo.',
    fsBlocked: 'No se pudo alternar pantalla completa en esta ventana.',
  },
  settings: {
    title: 'Configuración',
    menuBack: 'Menú',
    closeAria: 'Cerrar configuración',
    languagesBtn: 'Idiomas',
    languagesHint: 'Elige el idioma del juego',
    languagesTitle: 'Idiomas',
    languagesDesc: 'Todo el texto del juego se traduce al instante al seleccionarlo.',
    backToSettings: 'Volver a Configuración',
    languageOptions: {
      'pt-BR': 'Portugués',
      en: 'Inglés',
      es: 'Español',
      zh: 'Chino',
      ja: 'Japonés',
      ar: 'Árabe',
    },
    cameraSensitivity: 'Sensibilidad de la Cámara',
    jungleAudio: 'Audio de la Selva',
    muteAll: 'Silenciar Todo',
    mutedAll: 'Audio Silenciado',
    ambientSound: 'Sonido Ambiental (Selva y Fauna)',
    sfxSound: 'Efectos de Sonido (Pasos e Ítems)',
    mutedShort: 'Silencio',
    invertY: 'Invertir Eje Vertical (Y)',
    invertYDesc: 'Invierte el movimiento arriba/abajo de la cámara',
    enabled: 'Activado',
    disabled: 'Desactivado',
    graphicsSection: 'Rendimiento Gráfico y Atmósfera',
    graphicsQuality: 'Calidad Gráfica',
    graphicsQualityDesc:
      'Mantiene toda la vegetación en cualquier nivel · Patata: estilo plano sin sombras · High: máximo detalle',
    qualities: {
      potato: 'Modo Patata',
      'ultra-low': 'Low',
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      'ultra-high': 'High',
    },
    atmosphereLabel: 'Atmósfera y Rayos de Luz',
    atmosphereDesc: 'Ajusta la niebla y los rayos solares sin perder FPS',
    fpsLimit: 'Límite de FPS',
    fpsUnlimited: 'Ilimitado',
    fpsCounter: 'Contador de FPS',
    fpsCounterDesc: 'Muestra la tasa de cuadros en la esquina',
    fullscreenLabel: 'Pantalla Completa',
    fullscreenDesc: 'Alterna la vista en pantalla completa',
    fullscreenActivate: 'Activar',
    fullscreenExitShort: 'Salir',
    hudSection: 'Personalización del HUD',
    hudDragDesc: 'Arrastra botones y paneles libremente por la pantalla',
    editHudBtn: 'Editar HUD',
    hudScale: 'Tamaño Global del HUD',
    hudOpacity: 'Opacidad de Paneles',
    hudQuickPos: 'Posición Rápida del Estado',
    hudTopLeft: 'Sup. Izq.',
    hudBottomLeft: 'Inf. Izq.',
    showCompass: 'Mostrar Brújula',
    showCompassDesc: 'Muestra dirección hacia las reliquias',
    showTips: 'Mostrar Consejos en Pantalla',
    showTipsDesc: 'Muestra pistas contextuales y atajos',
    touchControls: 'Controles Táctiles en Pantalla',
    touchAuto: 'Automático',
    touchAlways: 'Visible',
    touchHidden: 'Oculto',
    backToMenuBtn: 'Volver al Menú',
    closeBtn: 'Cerrar',
  },
  hud: {
    relics: 'Reliquias',
    landmarks: 'Hitos',
    agility: 'Agilidad',
    sword: 'Espada',
    axe: 'Hacha',
    attack: 'Atacar',
    eatBerries: 'Comer Bayas',
    eatBerriesTitle: 'Comer Bayas Dulces (+18 Salud y Energía)',
    jump: 'Saltar',
    interactAria: 'Interactuar',
    attackAria: 'Atacar',
    lightTorch: 'Antorcha',
    lightFlashlight: 'Linterna',
    lightTurnOnAria: 'Encender luz (F)',
    lightTurnOffAria: 'Apagar luz (F)',
    inventoryBtn: 'Inventario',
    inventoryAria: 'Abrir inventario (I)',
    camera1stAria: 'Cambiar a cámara en 3ª persona (V)',
    camera3rdAria: 'Cambiar a cámara en 1ª persona (V)',
    pauseBtn: 'Pausar',
    pauseAria: 'Pausar juego',
    muteAria: 'Silenciar sonido',
    unmuteAria: 'Activar sonido',
    fullscreenAria: 'Pantalla completa',
    exitFullscreenAria: 'Salir de pantalla completa',
    fpsSuffix: 'FPS',
    tipLocked: 'Ratón libre 360° · Clic/Q Atacar · V Cámara 1ª/3ª · Esc Pausar',
    tipUnlocked: 'Arrastra para girar 360° · Scroll/V Cámara 1ª/3ª · Shift correr · Q atacar',
    predatorChase: '¡Depredador persiguiendo! Corre (Shift), refúgiate en una cabaña o ataca (Q).',
    predatorStalk: '¡Depredador nocturno acechando cerca!',
    objectivePrefix: 'Objetivo',
    stamina: 'Resistencia',
    staminaExhausted: 'Agotada',
    food: 'Alimento',
    foodLow: 'Hambre',
    swimming: 'Nadando',
    interactGuide: 'Hablar con el Guía',
    interactGuideSub: 'Instrucciones iniciales obligatorias',
    lieDown: 'Acostarse',
    sleepNightOnly: 'Solo de noche',
    sleepingTitle: 'Descansando hasta el amanecer...',
    sleepingDesc: 'Recuperando fuerzas mientras pasa la noche en la selva.',
    treeTarget: 'Árbol de la Selva',
    rockTarget: 'Roca del Bosque',
  },
  hudEditor: {
    editing: 'Editando',
    dragHint: 'Arrastra cualquier panel o botón por la pantalla',
    scale: 'Tamaño',
    opacity: 'Opacidad',
    resetDefault: 'Restaurar',
    cancel: 'Cancelar',
    save: 'Guardar',
    labels: {
      status: 'Estado, Salud y Resistencia',
      compass: 'Brújula',
      toolbar: 'Barra Superior',
      fps: 'Contador FPS',
      joystick: 'Joystick',
      actions: 'Botones de Acción',
      interact: 'Botón Recoger (E)',
      tips: 'Consejos de Control',
    },
    previewStatusZone: 'Claro del Sol · Día · Cielo Despejado',
    previewCompass: 'Brújula',
    previewJump: 'Saltar',
    previewCollect: 'Recoger Ítem',
    previewTips: 'Arrastra para girar 360° · Q atacar · V cámara',
  },
  inventory: {
    title: 'Mochila de Exploración',
    subtitle: 'Gestiona equipo, consumibles, hogueras y recursos recolectados',
    closeAria: 'Cerrar inventario',
    emptySlot: 'Vacío',
    inUse: 'En uso',
    quantityInBag: 'Cantidad en mochila',
    lightStatus: 'Luz actual',
    lightOn: 'Encendida (Pulsa F para apagar)',
    lightOff: 'Apagada (Pulsa F para encender)',
    selectPrompt: 'Selecciona un objeto de la cuadrícula para ver detalles y acciones.',
    useItem: 'Usar Objeto',
    equip: 'Equipar',
    unequip: 'Desequipar',
    backToExplore: 'Volver a Explorar (I / Esc)',
    craftTorchTitle: 'Crear Antorcha',
    craftBandageTitle: 'Vendaje Medicinal (+35 Salud)',
    craftCampfireTitle: 'Montar Hoguera',
    craftTorchBtn: 'Crear',
    craftBandageBtn: 'Aplicar',
    craftCampfireBtn: 'Montar',
    woodShort: 'Madera',
    stoneShort: 'Piedra',
    herbShort: 'Hierba',
    ropeShort: 'Cuerda',
    categories: {
      Equipamento: 'Equipo',
      Arma: 'Arma',
      Consumível: 'Consumible',
      Recurso: 'Recurso',
    },
    items: {
      lantern: {
        name: 'Linterna de Expedición',
        description: 'Ilumina senderos oscuros de noche en la selva. Pulsa F para encender o apagar.',
      },
      torch: {
        name: 'Antorcha de la Selva',
        description: 'Antorcha artesanal de llama cálida. Se fabrica con 2 Maderas y 1 Piedra.',
      },
      compass: {
        name: 'Brújula de Latón',
        description: 'Instrumento de navegación que guía hacia reliquias e hitos.',
      },
      axe: {
        name: 'Hacha de Exploración',
        description: 'Herramienta robusta de acero. Equípala para defenderte con golpes fuertes (tecla Q).',
      },
      sword: {
        name: 'Espada de la Selva',
        description: 'Hoja equilibrada ideal para ahuyentar depredadores nocturnos rápido (tecla Q).',
      },
      medkit: {
        name: 'Botiquín',
        description: 'Vendas y antiséptico de campo. Restaura 45 puntos de salud al instante.',
      },
      rations: {
        name: 'Comida y Agua',
        description: 'Cantimplora fresca y raciones. Restaura 25 de salud y da agilidad por 14s.',
      },
      raw_meat: {
        name: 'Carne Cruda',
        description: 'Carne fresca de caza. Monta una hoguera para asarla o cómela cruda (+30 Salud).',
      },
      cooked_meat: {
        name: 'Carne Asada',
        description: 'Carne asada a las brasas. Restaura 55 de salud y da energía durante 20s.',
      },
      sweet_berry: {
        name: 'Bayas Dulces',
        description: 'Bayas silvestres jugosas. Restauran 18 de salud y dan energía por 12s.',
      },
      fruit: {
        name: 'Fruta Tropical',
        description: 'Fruto dulce e hidratante. Restaura 12 de salud y aumenta la agilidad por 14s.',
      },
      herb: {
        name: 'Hierba del Claro',
        description: 'Hoja medicinal aromática. Restaura 18 de salud y da vigor extra por 10s.',
      },
      rope: {
        name: 'Cuerda Resistente',
        description: 'Cuerda natural trenzada. Combínala con 1 Hierba para hacer un Vendaje (+35 Salud).',
      },
      wood: {
        name: 'Madera Firme',
        description: 'Ramas secas recogidas en la selva. Útiles para antorchas y hogueras.',
      },
      stone: {
        name: 'Piedra de Sílex',
        description: 'Piedra lisa de río capaz de generar chispas para encender fuego.',
      },
    },
  },
  pauseVictory: {
    victoryTitle: '¡Expedición Completada!',
    victoryDesc: 'Exploraste todos los claros y reuniste todas las reliquias de la selva.',
    fallenTitle: 'Has resultado herido en la selva',
    fallenDesc: 'Los depredadores nocturnos te atacaron. Recupérate en el Claro del Sol o reinicia.',
    pauseTitle: 'Juego Pausado',
    pauseDesc: 'La exploración está en pausa. Retoma cuando estés listo.',
    relics: 'Reliquias',
    landmarks: 'Hitos',
    time: 'Tiempo',
    respawnBtn: 'Recuperarse en el Claro',
    resumeVictoryBtn: 'Seguir Explorando Libremente',
    resumeBtn: 'Continuar',
    settingsBtn: 'Configuración',
    restartBtn: 'Reiniciar Expedición',
    backToTitleBtn: 'Volver al Menú',
  },
  zones: {
    'cabin-trail': 'Cabaña del Sendero',
    'cabin-stream': 'Refugio del Arroyo',
    'cabin-north': 'Puesto del Bosque Alto',
    'cabin-cedars': 'Cabaña de los Cedros',
    'cabin-abandoned': 'Refugio Abandonado',
    'cabin-forester': 'Casa del Guardabosques',
    'village-nascente': 'Aldea del Manantial',
    'village-vale': 'Villa del Valle Verde',
    'village-norte': 'Poblado del Norte',
    central: 'Claro del Sol',
    ruins: 'Altar de las Ruinas',
    overlook: 'Mirador de Piedra Alta',
    stream: 'Arroyo Esmeralda',
    palms: 'Bosque de Palmeras',
    grove: 'Santuario de la Raíz',
    trail: 'Sendero de la Selva',
    dense_jungle: 'Selva Densa',
  },
  dayPhases: {
    dawn: 'Amanecer',
    day: 'Día',
    dusk: 'Atardecer',
    night: 'Noche',
  },
  weather: {
    clear: 'Cielo Despejado',
    starry: 'Noche Estrellada',
    mist: 'Niebla Húmeda',
    light_rain: 'Lluvia Ligera',
    storm: 'Tormenta',
  },
  animals: {
    deer: 'Ciervo del Bosque',
    capybara: 'Carpincho',
    macaw: 'Guacamayo Rojo',
    jaguar: 'Jaguar',
    panther: 'Pantera Negra',
  },
  relics: {
    'relic-sun': {
      title: 'Reliquia del Sol Naciente',
      subtitle: 'Amuleto dorado dejado junto al claro inicial',
    },
    'relic-jaguar': {
      title: 'Ídolo del Jaguar',
      subtitle: 'Escultura antigua guardada en el altar de piedra',
    },
    'relic-orchid': {
      title: 'Orquídea Dorada',
      subtitle: 'Flor luminosa rara que crece en el mirador alto',
    },
    'relic-crystal': {
      title: 'Cristal del Manantial',
      subtitle: 'Cuarzo esmeralda pulido por el agua del arroyo',
    },
    'relic-root': {
      title: 'Tótem de las Raíces',
      subtitle: 'Talismán tallado en madera del santuario sur',
    },
  },
  landmarks: {
    'landmark-ruins': {
      title: 'Altar de las Ruinas',
      subtitle: 'Monolito ancestral cubierto de musgo y lianas',
    },
    'landmark-overlook': {
      title: 'Mirador de Piedra Alta',
      subtitle: 'Meseta rocosa con vista abierta sobre la selva',
    },
    'landmark-stream': {
      title: 'Manantial Esmeralda',
      subtitle: 'Laguna cristalina rodeada de helechos y piedras',
    },
  },
  guide: {
    speaker: 'Guía Kauã',
    badge: 'Guía del Claro',
    stepOf: 'Paso',
    next: 'Continuar',
    startExplore: 'Comenzar Exploración',
    pages: [
      {
        title: 'Controles y Exploración',
        body: 'Usa WASD (o el joystick táctil) para recorrer senderos, montañas, ríos y aldeas. Mantén Shift para correr consumiendo resistencia de 10 en 10, Espacio para saltar o nadar en los ríos, y V para cambiar entre cámara en 1ª y 3ª persona.',
      },
      {
        title: 'Recolección y Caza',
        body: 'Recoge madera, piedras, bayas y cajas de suministros en las aldeas con E. Equipa tu Hacha o Espada en el Inventario (I) y golpea con Q o clic para talar árboles (3 maderas), romper rocas (3 piedras) y cazar animales.',
      },
      {
        title: 'Salud, Resistencia y Alimento',
        body: 'Vigila las 3 barras: Salud, Resistencia (se recupera de 20 en 20 al descansar) y Alimento. Tu barra de alimento baja 20 puntos cada 2 minutos: come bayas (R), frutas, raciones o carne antes de pasar hambre.',
      },
      {
        title: 'Hogueras, Luz y Reliquias',
        body: 'Construye hogueras desde el Inventario (I) con madera y piedra para iluminar la noche y asar Carne Cruda (E). Al anochecer, enciende tu linterna o antorcha con F y sigue la brújula superior para reunir las 5 reliquias.',
      },
    ],
  },
};

const ZH: TranslationDict = {
  gameTitle: '丛林回声',
  titleEyebrow: '3D 热带探索冒险',
  titleSubtitle: '穿越密林树冠下的古老小径，探索阳光林间空地并找回失落的遗物。',
  playBtn: '开始游戏',
  settingsBtn: '设置',
  fullscreenEnter: '全屏模式',
  fullscreenExit: '退出全屏',
  welcomeLine: '欢迎来到丛林回声！',
  controlsFooter: 'WASD 移动 · 鼠标/触控 360°视角 · V 第一/三人称 · E 交互 · I 背包 · Q 攻击 · F 照明',
  system: {
    canvasAria: '3D 热带丛林场景',
    webglNoticeTitle: '3D 图形提示',
    webglErrorMsg: '无法在此浏览器中初始化 3D WebGL 渲染上下文。',
    fsExitUnsupported: '当前浏览器不支持退出全屏。',
    fsUnsupported: '当前设备不支持或阻止了全屏模式。',
    fsBlocked: '无法在此窗口中切换全屏模式。',
  },
  settings: {
    title: '设置',
    menuBack: '菜单',
    closeAria: '关闭设置',
    languagesBtn: '语言',
    languagesHint: '选择游戏语言',
    languagesTitle: '语言',
    languagesDesc: '选择任意语言后，游戏内所有文本将立即翻译。',
    backToSettings: '返回设置',
    languageOptions: {
      'pt-BR': '葡萄牙语',
      en: '英语',
      es: '西班牙语',
      zh: '中文',
      ja: '日语',
      ar: '阿拉伯语',
    },
    cameraSensitivity: '镜头灵敏度',
    jungleAudio: '丛林音效',
    muteAll: '全部静音',
    mutedAll: '已静音',
    ambientSound: '环境音（森林与动物）',
    sfxSound: '游戏音效（脚步与物品）',
    mutedShort: '静音',
    invertY: '反转垂直视角 (Y)',
    invertYDesc: '反转镜头的上下移动方向',
    enabled: '开启',
    disabled: '关闭',
    graphicsSection: '画面性能与氛围',
    graphicsQuality: '画质等级',
    graphicsQualityDesc: '所有画质下保留完整植被 · 土豆模式：纯色无阴影 · 高画质：完整细节',
    qualities: {
      potato: '土豆画质',
      'ultra-low': '极低',
      low: '低',
      medium: '中',
      high: '高',
      'ultra-high': '极高',
    },
    atmosphereLabel: '大气雾效与丁达尔光',
    atmosphereDesc: '调整雾气浓度与林间光束，不影响帧率',
    fpsLimit: '帧率上限',
    fpsUnlimited: '无限制',
    fpsCounter: '帧率显示',
    fpsCounterDesc: '在屏幕角落显示实时 FPS',
    fullscreenLabel: '全屏显示',
    fullscreenDesc: '切换浏览器全屏状态',
    fullscreenActivate: '开启',
    fullscreenExitShort: '退出',
    hudSection: 'HUD 界面自定义',
    hudDragDesc: '在屏幕上自由拖动按钮和面板位置',
    editHudBtn: '编辑 HUD',
    hudScale: 'HUD 全局缩放',
    hudOpacity: '面板透明度',
    hudQuickPos: '状态栏快速位置',
    hudTopLeft: '左上角',
    hudBottomLeft: '左下角',
    showCompass: '显示罗盘',
    showCompassDesc: '在顶部显示遗物方向',
    showTips: '显示屏幕提示',
    showTipsDesc: '显示操作指引和快捷键',
    touchControls: '屏幕触控摇杆',
    touchAuto: '自动',
    touchAlways: '始终显示',
    touchHidden: '隐藏',
    backToMenuBtn: '返回主菜单',
    closeBtn: '关闭',
  },
  hud: {
    relics: '遗物',
    landmarks: '地标',
    agility: '敏捷',
    sword: '丛林剑',
    axe: '探索斧',
    attack: '攻击',
    eatBerries: '吃浆果',
    eatBerriesTitle: '食用甜浆果 (+18 生命与精力)',
    jump: '跳跃',
    interactAria: '交互',
    attackAria: '攻击',
    lightTorch: '火把',
    lightFlashlight: '手电',
    lightTurnOnAria: '打开照明 (F)',
    lightTurnOffAria: '关闭照明 (F)',
    inventoryBtn: '背包',
    inventoryAria: '打开背包 (I)',
    camera1stAria: '切换第三人称视角 (V)',
    camera3rdAria: '切换第一人称视角 (V)',
    pauseBtn: '暂停',
    pauseAria: '暂停游戏',
    muteAria: '静音',
    unmuteAria: '开启声音',
    fullscreenAria: '全屏',
    exitFullscreenAria: '退出全屏',
    fpsSuffix: 'FPS',
    tipLocked: '鼠标自由环视 · 点击/Q 攻击 · V 切换视角 · Esc 暂停',
    tipUnlocked: '拖动旋转视角 · 滚轮/V 切换视角 · Shift 奔跑 · Q 攻击',
    predatorChase: '猛兽追击中！按 Shift 冲刺、躲进木屋或按 Q 反击。',
    predatorStalk: '附近有夜间猛兽潜伏！',
    objectivePrefix: '当前目标',
    stamina: '耐力',
    staminaExhausted: '已耗尽',
    food: '饥饿度',
    foodLow: '饥饿',
    swimming: '游泳中',
    interactGuide: '与向导对话',
    interactGuideSub: '必须先听取开局指引',
    lieDown: '躺下休息',
    sleepNightOnly: '仅限夜晚',
    sleepingTitle: '正在休息至黎明...',
    sleepingDesc: '随着丛林夜色消退，正在恢复体力。',
    treeTarget: '丛林大树',
    rockTarget: '丛林岩石',
  },
  hudEditor: {
    editing: '正在编辑',
    dragHint: '在屏幕上拖动任意面板或按钮',
    scale: '大小',
    opacity: '透明度',
    resetDefault: '恢复默认',
    cancel: '取消',
    save: '保存',
    labels: {
      status: '状态、生命与耐力',
      compass: '罗盘',
      toolbar: '顶部工具栏',
      fps: 'FPS 计数',
      joystick: '虚拟摇杆',
      actions: '动作按钮',
      interact: '拾取按钮 (E)',
      tips: '操作提示',
    },
    previewStatusZone: '阳光空地 · 白天 · 晴朗',
    previewCompass: '罗盘',
    previewJump: '跳跃',
    previewCollect: '拾取物品',
    previewTips: '拖动环视 · Q 攻击 · V 视角',
  },
  inventory: {
    title: '探索背包',
    subtitle: '管理装备、消耗品、篝火建造与采集的资源',
    closeAria: '关闭背包',
    emptySlot: '空',
    inUse: '已装备',
    quantityInBag: '背包数量',
    lightStatus: '照明状态',
    lightOn: '已开启（按 F 关闭）',
    lightOff: '已关闭（按 F 开启）',
    selectPrompt: '点击网格中的物品查看详情与操作。',
    useItem: '使用物品',
    equip: '装备',
    unequip: '卸下',
    backToExplore: '返回探索 (I / Esc)',
    craftTorchTitle: '制作丛林火把',
    craftBandageTitle: '制作草药绷带 (+35 生命)',
    craftCampfireTitle: '搭建丛林篝火',
    craftTorchBtn: '制作',
    craftBandageBtn: '使用',
    craftCampfireBtn: '搭建',
    woodShort: '木材',
    stoneShort: '燧石',
    herbShort: '草药',
    ropeShort: '绳索',
    categories: {
      Equipamento: '装备',
      Arma: '武器',
      Consumível: '消耗品',
      Recurso: '资源',
    },
    items: {
      lantern: {
        name: '探险手电筒',
        description: '在夜晚照亮黑暗的丛林小径。按 F 键开关。',
      },
      torch: {
        name: '丛林火把',
        description: '手工制作的暖焰火把。可用 2 根硬木和 1 块燧石制作。',
      },
      compass: {
        name: '黄铜罗盘',
        description: '指引探险者前往失落遗物与地标的导航仪。',
      },
      axe: {
        name: '探索斧',
        description: '坚固的钢制手斧。装备后可用强力劈砍自卫（按 Q 键）。',
      },
      sword: {
        name: '丛林长剑',
        description: '平衡顺手的长刃，适合快速击退夜间猛兽（按 Q 键）。',
      },
      medkit: {
        name: '急救包',
        description: '野外绷带与消毒用品。使用后立即恢复 45 点生命值。',
      },
      rations: {
        name: '干粮与清水',
        description: '清凉水壶与口粮。恢复 25 点生命并提升敏捷 14 秒。',
      },
      raw_meat: {
        name: '生肉',
        description: '狩猎获得的新鲜肉类。搭建篝火烤熟效果翻倍，或直接食用 (+30 生命)。',
      },
      cooked_meat: {
        name: '烤肉',
        description: '在篝火炭火上烤熟的鲜肉。恢复 55 点生命并赋予 20 秒精力加成。',
      },
      sweet_berry: {
        name: '甜浆果',
        description: '从丛林灌木采摘的多汁野果。恢复 18 点生命并提供 12 秒精力。',
      },
      fruit: {
        name: '热带水果',
        description: '甘甜解渴的林间果实。恢复 12 点生命并提升敏捷 14 秒。',
      },
      herb: {
        name: '空地草药',
        description: '芳香药草叶片。恢复 18 点生命并提供 10 秒额外体力。',
      },
      rope: {
        name: '结实绳索',
        description: '天然纤维编织绳。与 1 份草药组合可制成绷带 (+35 生命)。',
      },
      wood: {
        name: '硬木枝',
        description: '林中拾取的干燥木枝，用于制作火把和搭建篝火。',
      },
      stone: {
        name: '燧石',
        description: '河岸光滑的石头，能打出火花点燃火把与篝火。',
      },
    },
  },
  pauseVictory: {
    victoryTitle: '探索圆满完成！',
    victoryDesc: '你已踏遍所有林间空地并找回丛林中全部古代遗物。',
    fallenTitle: '你在丛林中受了重伤',
    fallenDesc: '夜间猛兽袭击了你。请返回阳光空地休整或重新开始。',
    pauseTitle: '游戏已暂停',
    pauseDesc: '探险暂时挂起，准备好后随时继续。',
    relics: '遗物',
    landmarks: '地标',
    time: '用时',
    respawnBtn: '在空地恢复',
    resumeVictoryBtn: '继续自由探索',
    resumeBtn: '继续游戏',
    settingsBtn: '设置',
    restartBtn: '重新开始',
    backToTitleBtn: '返回主菜单',
  },
  zones: {
    'cabin-trail': '小径木屋',
    'cabin-stream': '溪畔小屋',
    'cabin-north': '高地哨所',
    'cabin-cedars': '雪松木屋',
    'cabin-abandoned': '废弃避难所',
    'cabin-forester': '护林员小屋',
    'village-nascente': '泉源村落',
    'village-vale': '翠谷村',
    'village-norte': '北方聚落',
    central: '阳光空地',
    ruins: '废墟祭坛',
    overlook: '高岩瞭望台',
    stream: '翡翠溪流',
    palms: '棕榈林',
    grove: '古根圣地',
    trail: '丛林小径',
    dense_jungle: '浓密丛林',
  },
  dayPhases: {
    dawn: '黎明',
    day: '白天',
    dusk: '黄昏',
    night: '夜晚',
  },
  weather: {
    clear: '晴空',
    starry: '繁星夜空',
    mist: '湿润薄雾',
    light_rain: '小雨',
    storm: '暴雨',
  },
  animals: {
    deer: '林鹿',
    capybara: '水豚',
    macaw: '绯红金刚鹦鹉',
    jaguar: '美洲豹',
    panther: '黑豹',
  },
  relics: {
    'relic-sun': {
      title: '旭日遗物',
      subtitle: '留在初始空地旁的金色护符',
    },
    'relic-jaguar': {
      title: '美洲豹神像',
      subtitle: '供奉在石祭坛上的古老雕像',
    },
    'relic-orchid': {
      title: '金色兰花',
      subtitle: '生长在高处瞭望台的稀有发光花卉',
    },
    'relic-crystal': {
      title: '泉源水晶',
      subtitle: '被溪水打磨光滑的翡翠石英',
    },
    'relic-root': {
      title: '古根图腾',
      subtitle: '雕刻在南部圣地木柱上的护身符',
    },
  },
  landmarks: {
    'landmark-ruins': {
      title: '废墟祭坛',
      subtitle: '长满青苔与藤蔓的古老石碑',
    },
    'landmark-overlook': {
      title: '高岩瞭望台',
      subtitle: '可俯瞰整片树冠的岩石高台',
    },
    'landmark-stream': {
      title: '翡翠泉',
      subtitle: '被蕨类与鹅卵石环绕的清澈水潭',
    },
  },
  guide: {
    speaker: '巡林向导 卡乌阿',
    badge: '空地向导',
    stepOf: '步骤',
    next: '继续',
    startExplore: '开始探索',
    pages: [
      {
        title: '操作与地形探索',
        body: '使用 WASD（或屏幕摇杆）穿越小径、高山、河流和散布的村落。按住 Shift 冲刺会以每次 10 点消耗耐力，按空格跳跃或在河中游泳，按 V 切换第一人称与第三人称视角。',
      },
      {
        title: '资源采集与狩猎',
        body: '按 E 采集木材、燧石、浆果及村落补给箱。在背包 (I) 中装备斧头或长剑，按 Q 或点击攻击即可砍倒树木（掉落 3 根木材）、击碎岩石（掉落 3 块燧石）并狩猎获取生肉。',
      },
      {
        title: '生命、耐力与食物',
        body: '留意三条生存状态栏：生命、耐力（休息时每次恢复 20 点）和食物。食物栏每 2 分钟下降 20 点——及时食用浆果 (R)、水果、干粮或烤肉以防饥饿掉血！',
      },
      {
        title: '篝火、照明与遗物',
        body: '在背包 (I) 用木材与燧石搭建篝火，既可照亮黑夜，也能按 E 将生肉烤成香烤肉。夜晚按 F 开启手电或火把，跟随顶部罗盘收集全部 5 件古代遗物。',
      },
    ],
  },
};

const JA: TranslationDict = {
  gameTitle: 'ジャングルの残響',
  titleEyebrow: '3D 熱帯ジャングル探索',
  titleSubtitle:
    '深い樹冠の下の古道を歩き、陽光差し込む開拓地を巡って失われた遺物を取り戻そう。',
  playBtn: 'プレイ',
  settingsBtn: '設定',
  fullscreenEnter: '全画面',
  fullscreenExit: '全画面を終了',
  welcomeLine: 'ジャングルの残響へようこそ！',
  controlsFooter: 'WASD 移動 · マウス/タッチ 360°視点 · V 一人称/三人称 · E 調べる · I バッグ · Q 攻撃 · F ライト',
  system: {
    canvasAria: '3D 熱帯ジャングルワールド',
    webglNoticeTitle: '3D グラフィックス通知',
    webglErrorMsg: 'このブラウザで 3D WebGL コンテキストを初期化できませんでした。',
    fsExitUnsupported: 'このブラウザは全画面終了に対応していません。',
    fsUnsupported: 'この端末では全画面表示が非対応または制限されています。',
    fsBlocked: 'このウィンドウでは全画面に切り替えられません。',
  },
  settings: {
    title: '設定',
    menuBack: 'メニュー',
    closeAria: '設定を閉じる',
    languagesBtn: '言語',
    languagesHint: 'ゲームの言語を選択',
    languagesTitle: '言語',
    languagesDesc: '選択すると、ゲーム内のすべてのテキストが即座に翻訳されます。',
    backToSettings: '設定に戻る',
    languageOptions: {
      'pt-BR': 'ポルトガル語',
      en: '英語',
      es: 'スペイン語',
      zh: '中国語',
      ja: '日本語',
      ar: 'アラビア語',
    },
    cameraSensitivity: 'カメラ感度',
    jungleAudio: 'ジャングル音声',
    muteAll: 'すべてミュート',
    mutedAll: 'ミュート中',
    ambientSound: '環境音（森と野生動物）',
    sfxSound: '効果音（足音・アイテム）',
    mutedShort: 'ミュート',
    invertY: 'Y軸（上下）を反転',
    invertYDesc: 'カメラの上下操作を反転します',
    enabled: 'オン',
    disabled: 'オフ',
    graphicsSection: 'グラフィック性能と雰囲気',
    graphicsQuality: 'グラフィック品質',
    graphicsQualityDesc: '全品質で植生を維持 · ポテト：影なし軽量粘土風 · High：最高品質',
    qualities: {
      potato: 'ポテト画質',
      'ultra-low': '超低',
      low: '低',
      medium: '中',
      high: '高',
      'ultra-high': '最高',
    },
    atmosphereLabel: '霧と木漏れ日',
    atmosphereDesc: 'FPSに影響せず霧の濃さと光の筋を調整します',
    fpsLimit: 'FPS 上限',
    fpsUnlimited: '無制限',
    fpsCounter: 'FPS カウンター',
    fpsCounterDesc: '画面隅にフレームレートを表示します',
    fullscreenLabel: '全画面表示',
    fullscreenDesc: 'ブラウザの全画面表示を切り替えます',
    fullscreenActivate: '有効化',
    fullscreenExitShort: '終了',
    hudSection: 'HUD カスタマイズ',
    hudDragDesc: 'ボタンやパネルを画面上で自由にドラッグ配置',
    editHudBtn: 'HUD を編集',
    hudScale: 'HUD 全体サイズ',
    hudOpacity: 'パネル透明度',
    hudQuickPos: 'ステータスの位置',
    hudTopLeft: '左上',
    hudBottomLeft: '左下',
    showCompass: 'コンパスを表示',
    showCompassDesc: '上部に遺物の方向を表示します',
    showTips: '操作ヒントを表示',
    showTipsDesc: '状況に応じた操作ガイドを表示します',
    touchControls: '画面タッチ操作',
    touchAuto: '自動',
    touchAlways: '表示',
    touchHidden: '非表示',
    backToMenuBtn: 'メニューに戻る',
    closeBtn: '閉じる',
  },
  hud: {
    relics: '遺物',
    landmarks: '名所',
    agility: '俊敏',
    sword: '剣',
    axe: '斧',
    attack: '攻撃',
    eatBerries: 'ベリーを食べる',
    eatBerriesTitle: '甘いベリーを食べる (HP +18・体力回復)',
    jump: 'ジャンプ',
    interactAria: '調べる',
    attackAria: '攻撃',
    lightTorch: 'たいまつ',
    lightFlashlight: 'ライト',
    lightTurnOnAria: 'ライトを点ける (F)',
    lightTurnOffAria: 'ライトを消す (F)',
    inventoryBtn: 'バッグ',
    inventoryAria: 'インベントリを開く (I)',
    camera1stAria: '三人称視点へ切替 (V)',
    camera3rdAria: '一人称視点へ切替 (V)',
    pauseBtn: '一時停止',
    pauseAria: 'ゲームを一時停止',
    muteAria: '音声をミュート',
    unmuteAria: 'ミュート解除',
    fullscreenAria: '全画面',
    exitFullscreenAria: '全画面終了',
    fpsSuffix: 'FPS',
    tipLocked: 'マウス自由視点 · クリック/Q 攻撃 · V 視点切替 · Esc 一時停止',
    tipUnlocked: 'ドラッグで回転 · ホイール/V 視点切替 · Shift ダッシュ · Q 攻撃',
    predatorChase: '猛獣が追跡中！Shiftで逃げるか、小屋に入るか、Qで反撃しよう。',
    predatorStalk: '夜の猛獣が近くに潜んでいます！',
    objectivePrefix: '目標',
    stamina: 'スタミナ',
    staminaExhausted: '枯渇',
    food: '空腹度',
    foodLow: '空腹',
    swimming: '遊泳中',
    interactGuide: '案内人と話す',
    interactGuideSub: '出発前の必須ガイド',
    lieDown: '横になる',
    sleepNightOnly: '夜のみ',
    sleepingTitle: '夜明けまで休息中...',
    sleepingDesc: 'ジャングルの夜が過ぎる間、体力を回復しています。',
    treeTarget: 'ジャングルの木',
    rockTarget: 'ジャングルの岩',
  },
  hudEditor: {
    editing: '編集中',
    dragHint: '任意のパネルやボタンをドラッグして移動できます',
    scale: 'サイズ',
    opacity: '不透明度',
    resetDefault: '初期化',
    cancel: 'キャンセル',
    save: '保存',
    labels: {
      status: 'ステータス・HP・スタミナ',
      compass: 'コンパス',
      toolbar: '上部ツールバー',
      fps: 'FPS 表示',
      joystick: 'ジョイスティック',
      actions: 'アクションボタン',
      interact: '採取ボタン (E)',
      tips: '操作ヒント',
    },
    previewStatusZone: '太陽の広場 · 昼 · 快晴',
    previewCompass: 'コンパス',
    previewJump: '跳ぶ',
    previewCollect: 'アイテム採取',
    previewTips: 'ドラッグで回転 · Q 攻撃 · V 視点',
  },
  inventory: {
    title: '探検バックパック',
    subtitle: '装備・消耗品・焚き火クラフト・収集資源を管理',
    closeAria: 'バッグを閉じる',
    emptySlot: '空き',
    inUse: '装備中',
    quantityInBag: '所持数',
    lightStatus: '現在のライト',
    lightOn: '点灯中（Fキーで消灯）',
    lightOff: '消灯中（Fキーで点灯）',
    selectPrompt: 'グリッドからアイテムを選ぶと詳細と操作が表示されます。',
    useItem: '使う',
    equip: '装備する',
    unequip: '外す',
    backToExplore: '探索に戻る (I / Esc)',
    craftTorchTitle: 'ジャングルのたいまつを作成',
    craftBandageTitle: '薬草包帯を使用 (HP +35)',
    craftCampfireTitle: '焚き火を設置する',
    craftTorchBtn: '作成',
    craftBandageBtn: '使用',
    craftCampfireBtn: '設置',
    woodShort: '木材',
    stoneShort: '火打石',
    herbShort: '薬草',
    ropeShort: 'ロープ',
    categories: {
      Equipamento: '装備',
      Arma: '武器',
      Consumível: '消耗品',
      Recurso: '資源',
    },
    items: {
      lantern: {
        name: '探検懐中電灯',
        description: '夜の暗い密林の道を照らします。Fキーでオン・オフ。',
      },
      torch: {
        name: 'ジャングルのたいまつ',
        description: '温かい炎のたいまつ。頑丈な木材2本と火打石1個で作れます。',
      },
      compass: {
        name: '真鍮のコンパス',
        description: '失われた遺物や名所の方角を示す羅針盤。',
      },
      axe: {
        name: '探検の斧',
        description: '頑丈な鋼の斧。装備すると強力な一撃で身を守れます（Qキー）。',
      },
      sword: {
        name: 'ジャングルの剣',
        description: '扱いやすい長剣。夜の猛獣を素早く追い払えます（Qキー）。',
      },
      medkit: {
        name: '救急キット',
        description: '野戦用の包帯と消毒薬。使うとHPを45即座に回復します。',
      },
      rations: {
        name: '食料と水筒',
        description: '新鮮な水と携帯食。HPを25回復し14秒間移動速度が上がります。',
      },
      raw_meat: {
        name: '生肉',
        description: '狩りで得た新鮮な肉。焚き火で焼くと効果倍増、そのままでも回復(HP+30)。',
      },
      cooked_meat: {
        name: '焼き肉',
        description: '焚き火の熾火で焼いた肉。HPを55回復し20秒間エネルギーを得ます。',
      },
      sweet_berry: {
        name: '甘いベリー',
        description: '茂みから摘んだ果実。HPを18回復し12秒間エネルギーを付与します。',
      },
      fruit: {
        name: '南国フルーツ',
        description: '瑞々しい森の果実。HPを12回復し14秒間俊敏性を高めます。',
      },
      herb: {
        name: '広場の薬草',
        description: '香り高い薬葉。HPを18回復し10秒間スタミナを補います。',
      },
      rope: {
        name: '頑丈なロープ',
        description: '天然繊維のロープ。薬草1つと合わせて包帯(HP+35)にできます。',
      },
      wood: {
        name: '頑丈な木材',
        description: '森で拾った乾いた枝。たいまつや焚き火作りに使います。',
      },
      stone: {
        name: '火打石',
        description: '火花を起こしてたいまつや焚き火に火を点ける滑らかな川石。',
      },
    },
  },
  pauseVictory: {
    victoryTitle: '探検完了！',
    victoryDesc: 'すべての広場を巡り、ジャングルの古代遺物をすべて集めました。',
    fallenTitle: 'ジャングルで負傷しました',
    fallenDesc: '夜の猛獣に襲われました。太陽の広場で回復するかやり直してください。',
    pauseTitle: '一時停止',
    pauseDesc: '探索を一時停止しています。準備ができたら再開してください。',
    relics: '遺物',
    landmarks: '名所',
    time: '経過時間',
    respawnBtn: '広場で回復する',
    resumeVictoryBtn: '自由に探索を続ける',
    resumeBtn: '再開する',
    settingsBtn: '設定',
    restartBtn: '最初からやり直す',
    backToTitleBtn: 'タイトルメニューへ',
  },
  zones: {
    'cabin-trail': '小道の小屋',
    'cabin-stream': '小川の避難小屋',
    'cabin-north': '高地前哨基地',
    'cabin-cedars': '杉の小屋',
    'cabin-abandoned': '廃墟の避難所',
    'cabin-forester': '森番の家',
    'village-nascente': '泉の集落',
    'village-vale': '緑の谷の村',
    'village-norte': '北の集落',
    central: '太陽の広場',
    ruins: '遺跡の祭壇',
    overlook: '高岩の展望台',
    stream: 'エメラルドの小川',
    palms: 'ヤシの木立',
    grove: '根の聖域',
    trail: '森の小道',
    dense_jungle: '深いジャングル',
  },
  dayPhases: {
    dawn: '夜明け',
    day: '昼',
    dusk: '夕暮れ',
    night: '夜',
  },
  weather: {
    clear: '快晴',
    starry: '星空',
    mist: '湿った霧',
    light_rain: '小雨',
    storm: '嵐',
  },
  animals: {
    deer: '森の鹿',
    capybara: 'カピバラ',
    macaw: 'ベニコンゴウインコ',
    jaguar: 'ジャガー',
    panther: 'クロヒョウ',
  },
  relics: {
    'relic-sun': {
      title: '昇陽の遺物',
      subtitle: '最初の広場近くに遺された黄金の護符',
    },
    'relic-jaguar': {
      title: 'ジャガーの偶像',
      subtitle: '石の祭壇に祀られた古代彫刻',
    },
    'relic-orchid': {
      title: '黄金の蘭',
      subtitle: '高い展望台に咲く希少な輝く花',
    },
    'relic-crystal': {
      title: '泉の水晶',
      subtitle: '小川の流れに磨かれたエメラルド石英',
    },
    'relic-root': {
      title: '根のトーテム',
      subtitle: '南の聖域の木から彫られた護符',
    },
  },
  landmarks: {
    'landmark-ruins': {
      title: '遺跡の祭壇',
      subtitle: '苔と蔦に覆われた古代のモノリス',
    },
    'landmark-overlook': {
      title: '高岩の展望台',
      subtitle: '森の樹冠を一望できる岩の高台',
    },
    'landmark-stream': {
      title: 'エメラルドの泉',
      subtitle: 'シダと滑らかな石に囲まれた澄んだ池',
    },
  },
  guide: {
    speaker: '森の案内人 カウア',
    badge: '広場のガイド',
    stepOf: 'ステップ',
    next: '次へ',
    startExplore: '探索を始める',
    pages: [
      {
        title: '基本操作と地形探索',
        body: 'WASD（または画面ジョイスティック）で小道・山岳・川・各地の村を探索できます。Shiftでダッシュ（スタミナは10ずつ消費）、Spaceでジャンプや川での遊泳、Vで一人称・三人称視点を切り替えます。',
      },
      {
        title: '資源採取と狩猟',
        body: 'Eキーで木材・火打石・ベリー・村の物資箱を回収できます。バッグ (I) で斧や剣を装備し、Qまたはクリックで木を伐採（木材3個）、岩を砕き（石3個）、動物を狩って生肉を集めましょう。',
      },
      {
        title: 'HP・スタミナ・空腹度',
        body: 'HP・スタミナ（休憩で20ずつ回復）・空腹度の3つを管理しましょう。空腹度は2分ごとに20ずつ減少します。ベリー (R) や果実・食料・肉を食べて飢えを防ぎましょう！',
      },
      {
        title: '焚き火・ライト・遺物',
        body: 'バッグ (I) で木材と火打石から焚き火を作れば、夜を照らして生肉を焼き肉 (E) にできます。夜はFキーでライトやたいまつを点け、上のコンパスを頼りに5つの遺物を集めましょう。',
      },
    ],
  },
};

const AR: TranslationDict = {
  gameTitle: 'أصداء الغابة',
  titleEyebrow: 'استكشاف استوائي ثلاثي الأبعاد',
  titleSubtitle:
    'سر في الدروب القديمة تحت المظلة الكثيفة، واكتشف الفسحات المشمسة واستعد الآثار المفقودة.',
  playBtn: 'العب',
  settingsBtn: 'الإعدادات',
  fullscreenEnter: 'ملء الشاشة',
  fullscreenExit: 'إنهاء ملء الشاشة',
  welcomeLine: 'مرحباً بك في أصداء الغابة!',
  controlsFooter:
    'WASD للحركة · الفأرة/اللمس للنظر 360° · V تبديل الكاميرا · E تفاعل · I الحقيبة · Q هجوم · F إضاءة',
  system: {
    canvasAria: 'مشهد الغابة الاستوائية ثلاثي الأبعاد',
    webglNoticeTitle: 'تنبيه الرسومات ثلاثية الأبعاد',
    webglErrorMsg: 'تعذر تهيئة عرض WebGL ثلاثي الأبعاد في هذا المتصفح.',
    fsExitUnsupported: 'الخروج من وضع ملء الشاشة غير مدعوم في هذا المتصفح.',
    fsUnsupported: 'وضع ملء الشاشة غير مدعوم أو محظور على هذا الجهاز.',
    fsBlocked: 'تعذر تبديل وضع ملء الشاشة في هذه النافذة.',
  },
  settings: {
    title: 'الإعدادات',
    menuBack: 'القائمة',
    closeAria: 'إغلاق الإعدادات',
    languagesBtn: 'اللغات',
    languagesHint: 'اختر لغة اللعبة',
    languagesTitle: 'اللغات',
    languagesDesc: 'تُترجم جميع نصوص اللعبة فوراً عند اختيار أي لغة.',
    backToSettings: 'العودة إلى الإعدادات',
    languageOptions: {
      'pt-BR': 'البرتغالية',
      en: 'الإنجليزية',
      es: 'الإسبانية',
      zh: 'الصينية',
      ja: 'اليابانية',
      ar: 'العربية',
    },
    cameraSensitivity: 'حساسية الكاميرا',
    jungleAudio: 'أصوات الغابة',
    muteAll: 'كتم الكل',
    mutedAll: 'الصوت مكتوم',
    ambientSound: 'الصوت المحيطي (الغابة والحيوانات)',
    sfxSound: 'المؤثرات الصوتية (الخطوات والعناصر)',
    mutedShort: 'مكتوم',
    invertY: 'عكس المحور العمودي (Y)',
    invertYDesc: 'يعكس حركة الكاميرا للأعلى والأسفل',
    enabled: 'مفعل',
    disabled: 'معطل',
    graphicsSection: 'أداء الرسومات والأجواء',
    graphicsQuality: 'جودة الرسومات',
    graphicsQualityDesc:
      'تحافظ على كثافة الغطاء النباتي في كل المستويات · البطاطس: نمط بسيط بدون ظلال · High: أقصى تفاصيل',
    qualities: {
      potato: 'جودة البطاطس',
      'ultra-low': 'منخفض جداً',
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      'ultra-high': 'فائق',
    },
    atmosphereLabel: 'الأجواء وأشعة الشمس',
    atmosphereDesc: 'يضبط كثافة الضباب وأشعة الضوء دون التأثير على الأداء',
    fpsLimit: 'حد الإطارات (FPS)',
    fpsUnlimited: 'غير محدود',
    fpsCounter: 'عداد الإطارات',
    fpsCounterDesc: 'يعرض معدل الإطارات في زاوية الشاشة',
    fullscreenLabel: 'ملء الشاشة',
    fullscreenDesc: 'يبدل عرض المتصفح بملء الشاشة',
    fullscreenActivate: 'تفعيل',
    fullscreenExitShort: 'خروج',
    hudSection: 'تخصيص الواجهة (HUD)',
    hudDragDesc: 'اسحب الأزرار واللوحات بحرية على الشاشة',
    editHudBtn: 'تعديل الواجهة',
    hudScale: 'حجم الواجهة العام',
    hudOpacity: 'شفافية اللوحات',
    hudQuickPos: 'موضع لوحة الحالة',
    hudTopLeft: 'أعلى اليسار',
    hudBottomLeft: 'أسفل اليسار',
    showCompass: 'إظهار البوصلة',
    showCompassDesc: 'يعرض اتجاه الآثار في الأعلى',
    showTips: 'إظهار التلميحات',
    showTipsDesc: 'يعرض الإرشادات السياقية والاختصارات',
    touchControls: 'أزرار اللمس على الشاشة',
    touchAuto: 'تلقائي',
    touchAlways: 'ظاهر',
    touchHidden: 'مخفي',
    backToMenuBtn: 'العودة للقائمة',
    closeBtn: 'إغلاق',
  },
  hud: {
    relics: 'الآثار',
    landmarks: 'المعالم',
    agility: 'الرشاقة',
    sword: 'سيف',
    axe: 'فأس',
    attack: 'هجوم',
    eatBerries: 'أكل التوت',
    eatBerriesTitle: 'تناول التوت الحلو (+18 صحة وطاقة)',
    jump: 'قفز',
    interactAria: 'تفاعل',
    attackAria: 'هجوم',
    lightTorch: 'مشعل',
    lightFlashlight: 'مصباح',
    lightTurnOnAria: 'تشغيل الضوء (F)',
    lightTurnOffAria: 'إطفاء الضوء (F)',
    inventoryBtn: 'الحقيبة',
    inventoryAria: 'فتح الحقيبة (I)',
    camera1stAria: 'التبديل إلى منظور الشخص الثالث (V)',
    camera3rdAria: 'التبديل إلى منظور الشخص الأول (V)',
    pauseBtn: 'إيقاف',
    pauseAria: 'إيقاف مؤقت',
    muteAria: 'كتم الصوت',
    unmuteAria: 'تشغيل الصوت',
    fullscreenAria: 'ملء الشاشة',
    exitFullscreenAria: 'إنهاء ملء الشاشة',
    fpsSuffix: 'FPS',
    tipLocked: 'حركة حرة 360° · نقر/Q هجوم · V كاميرا · Esc إيقاف',
    tipUnlocked: 'اسحب للدوران 360° · عجلة/V كاميرا · Shift ركض · Q هجوم',
    predatorChase: 'مفترس يطاردك! اركض (Shift) أو احتمِ بكوخ أو هاجم (Q).',
    predatorStalk: 'مفترس ليلي يتربص بك في الأدغال!',
    objectivePrefix: 'الهدف',
    stamina: 'القدرة',
    staminaExhausted: 'منهكة',
    food: 'الغذاء',
    foodLow: 'جائع',
    swimming: 'يسبح',
    interactGuide: 'التحدث مع المرشد',
    interactGuideSub: 'تعليمات البداية الإلزامية',
    lieDown: 'استلقِ',
    sleepNightOnly: 'ليلاً فقط',
    sleepingTitle: 'استراحة حتى الفجر...',
    sleepingDesc: 'استعادة القوة مع انقضاء ليل الغابة.',
    treeTarget: 'شجرة الغابة',
    rockTarget: 'صخرة الغابة',
  },
  hudEditor: {
    editing: 'تعديل',
    dragHint: 'اسحب أي لوحة أو زر بحرية عبر الشاشة',
    scale: 'الحجم',
    opacity: 'الشفافية',
    resetDefault: 'استعادة الافتراضي',
    cancel: 'إلغاء',
    save: 'حفظ',
    labels: {
      status: 'الحالة والصحة والقدرة',
      compass: 'البوصلة',
      toolbar: 'الشريط العلوي',
      fps: 'عداد الإطارات',
      joystick: 'عصا التحكم',
      actions: 'أزرار الإجراء',
      interact: 'زر الالتقاط (E)',
      tips: 'تلميحات التحكم',
    },
    previewStatusZone: 'فسحة الشمس · نهار · سماء صافية',
    previewCompass: 'البوصلة',
    previewJump: 'قفز',
    previewCollect: 'التقاط عنصر',
    previewTips: 'اسحب للدوران 360° · Q هجوم · V كاميرا',
  },
  inventory: {
    title: 'حقيبة الاستكشاف',
    subtitle: 'إدارة العتاد والمستهلكات وإشعال المخيم والموارد',
    closeAria: 'إغلاق الحقيبة',
    emptySlot: 'فارغ',
    inUse: 'مُجهز',
    quantityInBag: 'الكمية في الحقيبة',
    lightStatus: 'حالة الضوء',
    lightOn: 'مضاء (اضغط F للإطفاء)',
    lightOff: 'مطفأ (اضغط F للإضاءة)',
    selectPrompt: 'اختر عنصراً من الشبكة لعرض التفاصيل والإجراءات.',
    useItem: 'استخدام',
    equip: 'تجهيز',
    unequip: 'إزالة التجهيز',
    backToExplore: 'العودة للاستكشاف (I / Esc)',
    craftTorchTitle: 'صنع مشعل الغابة',
    craftBandageTitle: 'ضمادة أعشاب (+35 صحة)',
    craftCampfireTitle: 'إشعال نار المخيم',
    craftTorchBtn: 'صنع',
    craftBandageBtn: 'تطبيق',
    craftCampfireBtn: 'بناء',
    woodShort: 'خشب',
    stoneShort: 'حجر',
    herbShort: 'عشبة',
    ropeShort: 'حبل',
    categories: {
      Equipamento: 'عتاد',
      Arma: 'سلاح',
      Consumível: 'مستهلك',
      Recurso: 'مورد',
    },
    items: {
      lantern: {
        name: 'مصباح الاستكشاف',
        description: 'يضيء الدروب المظلمة ليلاً في الغابة. اضغط F للتشغيل أو الإطفاء.',
      },
      torch: {
        name: 'مشعل الغابة',
        description: 'مشعل يدوي بلهب دافئ. يُصنع من 2 خشب متين و1 حجر صوان.',
      },
      compass: {
        name: 'بوصلة نحاسية',
        description: 'أداة ملاحة توجه المستكشف نحو الآثار والمعالم المفقودة.',
      },
      axe: {
        name: 'فأس الاستكشاف',
        description: 'أداة فولاذية متينة. جهزها للدفاع بضربات قوية (مفتاح Q).',
      },
      sword: {
        name: 'سيف الغابة',
        description: 'نصل متوازن مثالي لصد المفترسات الليلية بسرعة (مفتاح Q).',
      },
      medkit: {
        name: 'حقيبة إسعاف',
        description: 'ضمادات ومطهر ميداني. تستعيد 45 نقطة صحة فوراً عند الاستخدام.',
      },
      rations: {
        name: 'طعام وماء',
        description: 'مطارة ماء عذب ومؤن جافة. تستعيد 25 صحة وتمنح رشاقة لمدة 14 ثانية.',
      },
      raw_meat: {
        name: 'لحم نيء',
        description: 'لحم طازج من الصيد. أشعل نار مخيم لشوائه أو كله نيئاً (+30 صحة).',
      },
      cooked_meat: {
        name: 'لحم مشوي',
        description: 'لحم مشوي على جمر المخيم. يستعيد 55 نقطة صحة ويمنح طاقة لمدة 20 ثانية.',
      },
      sweet_berry: {
        name: 'توت حلو',
        description: 'توت بري عصيري من شجيرات الغابة. يستعيد 18 صحة ويمنح طاقة 12 ثانية.',
      },
      fruit: {
        name: 'فاكهة استوائية',
        description: 'فاكهة حلوة مرطبة. تستعيد 12 صحة وتزيد الرشاقة لمدة 14 ثانية.',
      },
      herb: {
        name: 'عشبة الفسحة',
        description: 'ورقة طبية عطرية. تستعيد 18 صحة وتمنح نفساً إضافياً 10 ثوانٍ.',
      },
      rope: {
        name: 'حبل متين',
        description: 'حبل مجدول من ألياف طبيعية. ادمجه مع عشبة لصنع ضمادة (+35 صحة).',
      },
      wood: {
        name: 'خشب متين',
        description: 'أغصان جافة قوية من الغابة. تُستخدم لصنع المشاعل ونار المخيم.',
      },
      stone: {
        name: 'حجر الصوان',
        description: 'حجر نهري أملس يُنتج شراراً لإشعال المشاعل ونار المخيم.',
      },
    },
  },
  pauseVictory: {
    victoryTitle: 'اكتملت الرحلة الاستكشافية!',
    victoryDesc: 'استكشفت كل الفسحات وجمعت جميع آثار الغابة القديمة.',
    fallenTitle: 'أُصبت في الغابة',
    fallenDesc: 'هاجمتك المفترسات الليلية في الأدغال. تعافَ في فسحة الشمس أو أعد المحاولة.',
    pauseTitle: 'اللعبة متوقفة',
    pauseDesc: 'الاستكشاف قيد الانتظار. استأنف عندما تكون مستعداً.',
    relics: 'الآثار',
    landmarks: 'المعالم',
    time: 'الوقت',
    respawnBtn: 'التعافي في الفسحة',
    resumeVictoryBtn: 'متابعة الاستكشاف بحرية',
    resumeBtn: 'استئناف',
    settingsBtn: 'الإعدادات',
    restartBtn: 'إعادة الرحلة',
    backToTitleBtn: 'العودة للقائمة الرئيسية',
  },
  zones: {
    'cabin-trail': 'كوخ الدرب',
    'cabin-stream': 'مأوى الجدول',
    'cabin-north': 'نقطة المرتفعات',
    'cabin-cedars': 'كوخ الأرز',
    'cabin-abandoned': 'الملاذ المهجور',
    'cabin-forester': 'منزل الحطاب',
    'village-nascente': 'قرية النبع',
    'village-vale': 'قرية الوادي الأخضر',
    'village-norte': 'مستوطنة الشمال',
    central: 'فسحة الشمس',
    ruins: 'مذبح الأطلال',
    overlook: 'مطل الصخرة العالية',
    stream: 'جدول الزمرد',
    palms: 'غابة النخيل',
    grove: 'ملاذ الجذور',
    trail: 'درب الغابة',
    dense_jungle: 'الغابة الكثيفة',
  },
  dayPhases: {
    dawn: 'الفجر',
    day: 'النهار',
    dusk: 'الغسق',
    night: 'الليل',
  },
  weather: {
    clear: 'سماء صافية',
    starry: 'سماء مرصعة بالنجوم',
    mist: 'ضباب رطب',
    light_rain: 'مطر خفيف',
    storm: 'عاصفة',
  },
  animals: {
    deer: 'أيل الغابة',
    capybara: 'كابيبارا',
    macaw: 'ببغاء الماكاو القرمزي',
    jaguar: 'جاغوار',
    panther: 'نمر أسود',
  },
  relics: {
    'relic-sun': {
      title: 'أثر الشمس المشرقة',
      subtitle: 'تميمة ذهبية متروكة قرب الفسحة الأولى',
    },
    'relic-jaguar': {
      title: 'تمثال الجاغوار',
      subtitle: 'منحوتة قديمة محفوظة على المذبح الحجري',
    },
    'relic-orchid': {
      title: 'الأوركيد الذهبية',
      subtitle: 'زهرة مضيئة نادرة تنمو على المطل المرتفع',
    },
    'relic-crystal': {
      title: 'بلورة النبع',
      subtitle: 'كوارتز زمردي صقلته مياه الجدول',
    },
    'relic-root': {
      title: 'طوطم الجذور',
      subtitle: 'تعويذة منحوتة في خشب الملاذ الجنوبي',
    },
  },
  landmarks: {
    'landmark-ruins': {
      title: 'مذبح الأطلال',
      subtitle: 'مسلة قديمة تغطيها الطحالب والكروم',
    },
    'landmark-overlook': {
      title: 'مطل الصخرة العالية',
      subtitle: 'هضبة صخرية بإطلالة مفتوحة فوق قمم الأشجار',
    },
    'landmark-stream': {
      title: 'نبع الزمرد',
      subtitle: 'بحيرة صافية محاطة بالسراخس والحجارة الملساء',
    },
  },
  guide: {
    speaker: 'المرشد كاوا',
    badge: 'مرشد الفسحة',
    stepOf: 'الخطوة',
    next: 'متابعة',
    startExplore: 'بدء الاستكشاف',
    pages: [
      {
        title: 'التحكم والاستكشاف',
        body: 'استخدم WASD (أو عصا التحكم على الشاشة) للتنقل عبر الدروب والجبال والأنهار والقرى. اضغط Shift للركض (تُستهلك القدرة بمقدار 10 لكل خطوة)، وSpace للقفز أو السباحة في الأنهار، وV لتبديل الكاميرا.',
      },
      {
        title: 'الجمع والصيد',
        body: 'اجمع الخشب والحجارة والتوت وصناديق الإمدادات في القرى عبر E. جهز الفأس أو السيف من الحقيبة (I) واضغط Q لقطع الأشجار (3 أخشاب) وتكسير الصخور (3 أحجار) وصيد الحيوانات.',
      },
      {
        title: 'الصحة والقدرة والغذاء',
        body: 'راقب مؤشرات البقاء الثلاثة: الصحة، والقدرة (تستعاد بمقدار 20 عند الراحة)، والغذاء. ينخفض شريط الغذاء بمقدار 20 كل دقيقتين — تناول التوت (R) أو الفاكهة أو اللحم قبل الجوع الشديد!',
      },
      {
        title: 'نار المخيم والإضاءة والآثار',
        body: 'اصنع نار مخيم من الحقيبة (I) بالخشب والحجر لإنارة الليل وشواء اللحم النيء (E). شغّل المصباح أو المشعل بالضغط على F ليلاً واتبع البوصلة لجمع الآثار الخمسة.',
      },
    ],
  },
};

export const TRANSLATIONS: Record<LanguageCode, TranslationDict> = {
  'pt-BR': PT_BR,
  en: EN,
  es: ES,
  zh: ZH,
  ja: JA,
  ar: AR,
};

export function getTranslator(lang: LanguageCode): TranslationDict {
  return TRANSLATIONS[lang] ?? TRANSLATIONS['pt-BR'];
}

export function formatObjectiveText(lang: LanguageCode, obj: HudObjective): string {
  const done = obj.done ?? 0;
  const total = obj.total ?? 5;
  switch (lang) {
    case 'en':
      switch (obj.key) {
        case 'talk_guide':
          return 'Talk to the Guide in the clearing (E)';
        case 'gather_resources':
          return 'Gather wood, stone & berries along the trails';
        case 'equip_weapon':
          return 'Equip your Axe or Sword in Inventory (I)';
        case 'roast_meat':
          return 'Build a campfire (I) and roast Raw Meat (E)';
        case 'prepare_night':
          return 'Night is falling! Turn on your light (F)';
        case 'recover_relics':
          return `Recover ancient relics (${done}/${total})`;
        case 'explore_landmarks':
          return `Discover jungle landmarks (${done}/${total})`;
        case 'expedition_complete':
          return 'Expedition complete — explore freely';
      }
      break;
    case 'es':
      switch (obj.key) {
        case 'talk_guide':
          return 'Habla con el Guía en el claro (E)';
        case 'gather_resources':
          return 'Recoge madera, piedra y bayas en los senderos';
        case 'equip_weapon':
          return 'Equipa tu Hacha o Espada en el Inventario (I)';
        case 'roast_meat':
          return 'Monta una hoguera (I) y asa Carne Cruda (E)';
        case 'prepare_night':
          return '¡Cae la noche! Enciende tu luz (F)';
        case 'recover_relics':
          return `Recupera reliquias antiguas (${done}/${total})`;
        case 'explore_landmarks':
          return `Descubre hitos de la selva (${done}/${total})`;
        case 'expedition_complete':
          return 'Expedición completa — explora libremente';
      }
      break;
    case 'zh':
      switch (obj.key) {
        case 'talk_guide':
          return '前往空地与向导对话 (E)';
        case 'gather_resources':
          return '沿小径收集木材、燧石与浆果';
        case 'equip_weapon':
          return '在背包 (I) 中装备斧头或长剑';
        case 'roast_meat':
          return '搭建篝火 (I) 并烤熟生肉 (E)';
        case 'prepare_night':
          return '夜幕降临！按 F 开启照明';
        case 'recover_relics':
          return `寻找古代遗物 (${done}/${total})`;
        case 'explore_landmarks':
          return `探索丛林地标 (${done}/${total})`;
        case 'expedition_complete':
          return '探索已完成 — 自由探索丛林';
      }
      break;
    case 'ja':
      switch (obj.key) {
        case 'talk_guide':
          return '広場の案内人と話そう (E)';
        case 'gather_resources':
          return '道沿いで木材・火打石・ベリーを集めよう';
        case 'equip_weapon':
          return 'バッグ (I) で斧や剣を装備しよう';
        case 'roast_meat':
          return '焚き火 (I) を作って生肉を焼こう (E)';
        case 'prepare_night':
          return '夜が来た！Fキーでライトを点けよう';
        case 'recover_relics':
          return `古代の遺物を回収 (${done}/${total})`;
        case 'explore_landmarks':
          return `ジャングルの名所を発見 (${done}/${total})`;
        case 'expedition_complete':
          return '探検完了 — 自由に散策しよう';
      }
      break;
    case 'ar':
      switch (obj.key) {
        case 'talk_guide':
          return 'تحدث مع المرشد في الفسحة (E)';
        case 'gather_resources':
          return 'اجمع الخشب والحجارة والتوت على طول الدروب';
        case 'equip_weapon':
          return 'جهز الفأس أو السيف من الحقيبة (I)';
        case 'roast_meat':
          return 'أشعل مخيماً (I) واشوِ اللحم النيء (E)';
        case 'prepare_night':
          return 'حل الليل! شغّل الإضاءة (F)';
        case 'recover_relics':
          return `استعد الآثار القديمة (${done}/${total})`;
        case 'explore_landmarks':
          return `اكتشف معالم الغابة (${done}/${total})`;
        case 'expedition_complete':
          return 'اكتملت الرحلة — استكشف بحرية';
      }
      break;
    default:
      switch (obj.key) {
        case 'talk_guide':
          return 'Converse com o Guia na clareira (E)';
        case 'gather_resources':
          return 'Colete madeira, pedra e bagas pelas trilhas';
        case 'equip_weapon':
          return 'Equipe Machado ou Espada no Inventário (I)';
        case 'roast_meat':
          return 'Monte uma fogueira (I) e asse Carne Crua (E)';
        case 'prepare_night':
          return 'Noite chegando! Acenda sua luz (F)';
        case 'recover_relics':
          return `Recupere relíquias antigas (${done}/${total})`;
        case 'explore_landmarks':
          return `Descubra os marcos da selva (${done}/${total})`;
        case 'expedition_complete':
          return 'Expedição concluída — explore livremente';
      }
  }
}

export function formatTipText(lang: LanguageCode, tip: HudTip): string {
  const t = getTranslator(lang);
  const itemName = tip.itemId ? t.inventory.items[tip.itemId].name : '';
  switch (lang) {
    case 'en':
      switch (tip.key) {
        case 'talk_guide':
          return 'Approach the Guide beside the campfire in the clearing and press E to begin.';
        case 'nearby_guide':
          return 'Press E or tap the button to speak with the Guide.';
        case 'swimming':
          return 'Swimming across the river — swim back to dry land to build campfires.';
        case 'nearby_campfire':
          return 'Press E or tap to roast Raw Meat over the campfire.';
        case 'nearby_bed_night':
          return 'Nighttime! Press E or tap Lie Down to sleep until morning.';
        case 'nearby_bed_day':
          return 'Rest bed — you can only sleep during the night.';
        case 'nearby_gatherable':
          return `Press E or walk closer to collect ${itemName}.`;
        case 'nearby_relic':
          return 'Press E or tap the button to collect the relic.';
        case 'nearby_landmark':
          return 'Press E or tap the button to register the landmark.';
        case 'predator_chase':
          return 'Predator nearby! Sprint (Shift), shelter in a cabin, or attack (Q).';
        case 'night_no_light':
          return 'Night fell! Press F or tap the light icon to turn on your light.';
        case 'start_explore':
          return 'Explore the open jungle, villages & mountains. Press I for inventory and Q to defend.';
        case 'follow_trail':
          return 'Follow the dirt trails to reach villages, river crossings, cabins, and ruins.';
        default:
          return 'Follow the compass at the top or open inventory (I) to equip gear.';
      }
    case 'es':
      switch (tip.key) {
        case 'talk_guide':
          return 'Acércate al Guía junto a la hoguera en el claro y pulsa E para empezar.';
        case 'nearby_guide':
          return 'Pulsa E o toca el botón para hablar con el Guía.';
        case 'swimming':
          return 'Nadando en el río — nada hacia la orilla para encender fogatas.';
        case 'nearby_campfire':
          return 'Pulsa E o toca el botón para asar Carne Cruda en la hoguera.';
        case 'nearby_bed_night':
          return '¡Es de noche! Pulsa E o toca Acostarse para dormir hasta el amanecer.';
        case 'nearby_bed_day':
          return 'Cama de descanso — solo es posible dormir durante la noche.';
        case 'nearby_gatherable':
          return `Pulsa E o acércate para recoger ${itemName}.`;
        case 'nearby_relic':
          return 'Pulsa E o toca el botón para recoger la reliquia.';
        case 'nearby_landmark':
          return 'Pulsa E o toca el botón para registrar el hito.';
        case 'predator_chase':
          return '¡Depredador cerca! Corre (Shift), refúgiate en una cabaña o ataca (Q).';
        case 'night_no_light':
          return '¡Cayó la noche! Pulsa F o toca el icono de luz para encenderla.';
        case 'start_explore':
          return 'Explora la selva, aldeas y montañas. Usa I para inventario y Q para defenderte.';
        case 'follow_trail':
          return 'Sigue los senderos hacia aldeas, ríos, cabañas y ruinas.';
        default:
          return 'Sigue la brújula arriba o abre el inventario (I) para equipar ítems.';
      }
    case 'zh':
      switch (tip.key) {
        case 'talk_guide':
          return '靠近空地篝火旁的向导并按 E 开始对话指引。';
        case 'nearby_guide':
          return '按 E 或点击按钮与向导对话。';
        case 'swimming':
          return '正在河中游泳 — 返回岸边干燥地面即可搭建篝火。';
        case 'nearby_campfire':
          return '按 E 或点击按钮在篝火上烤熟生肉。';
        case 'nearby_bed_night':
          return '夜幕降临！按 E 或点击“躺下休息”睡到天亮。';
        case 'nearby_bed_day':
          return '木屋床铺 — 只有在夜晚才可以入睡。';
        case 'nearby_gatherable':
          return `按 E 或靠近拾取 ${itemName}。`;
        case 'nearby_relic':
          return '按 E 或点击按钮收集遗物。';
        case 'nearby_landmark':
          return '按 E 或点击按钮记录地标。';
        case 'predator_chase':
          return '附近有猛兽！按 Shift 冲刺、进入木屋或按 Q 攻击。';
        case 'night_no_light':
          return '夜幕已降临！按 F 或点击照明按钮打开手电。';
        case 'start_explore':
          return '探索密林、村落与高山。按 I 打开背包，按 Q 进行防卫。';
        case 'follow_trail':
          return '沿着土路前往村落、河岸、木屋和古代遗迹。';
        default:
          return '跟随顶部罗盘指引，或打开背包 (I) 装备工具与武器。';
      }
    case 'ja':
      switch (tip.key) {
        case 'talk_guide':
          return '広場の焚き火そばにいる案内人に近づき E キーで話しかけましょう。';
        case 'nearby_guide':
          return 'Eキーまたはボタンで案内人と話せます。';
        case 'swimming':
          return '川を泳いでいます — 岸に上がると焚き火を設置できます。';
        case 'nearby_campfire':
          return 'Eキーまたはボタンで焚き火で生肉を焼けます。';
        case 'nearby_bed_night':
          return '夜になりました！Eキーまたは「横になる」で朝まで眠れます。';
        case 'nearby_bed_day':
          return 'ベッド — 眠れるのは夜の間だけです。';
        case 'nearby_gatherable':
          return `Eキーまたは近づいて ${itemName} を拾えます。`;
        case 'nearby_relic':
          return 'Eキーまたはボタンで遺物を回収できます。';
        case 'nearby_landmark':
          return 'Eキーまたはボタンで名所を記録できます。';
        case 'predator_chase':
          return '猛獣が接近中！Shiftで走るか、小屋に入るか、Qで攻撃しよう。';
        case 'night_no_light':
          return '夜になりました！Fキーまたはライトボタンで点灯しましょう。';
        case 'start_explore':
          return '森・村・山岳を探索しよう。Iでバッグ、Qで攻撃ができます。';
        case 'follow_trail':
          return '土の道を進むと村や川、小屋、遺跡に辿り着きます。';
        default:
          return '上のコンパスを頼りに進み、バッグ (I) から道具を装備しましょう。';
      }
    case 'ar':
      switch (tip.key) {
        case 'talk_guide':
          return 'اقترب من المرشد بجانب النار في الفسحة واضغط E للبدء.';
        case 'nearby_guide':
          return 'اضغط E أو المس الزر للتحدث مع المرشد.';
        case 'swimming':
          return 'تسبح في النهر — عُد إلى اليابسة لإشعال نار المخيم.';
        case 'nearby_campfire':
          return 'اضغط E أو المس الزر لشواء اللحم النيء على النار.';
        case 'nearby_bed_night':
          return 'حلّ الليل! اضغط E أو زر الاستلقاء للنوم حتى الصباح.';
        case 'nearby_bed_day':
          return 'سرير للراحة — يمكنك النوم ليلاً فقط.';
        case 'nearby_gatherable':
          return `اضغط E أو اقترب لالتقاط ${itemName}.`;
        case 'nearby_relic':
          return 'اضغط E أو المس الزر لجمع الأثر.';
        case 'nearby_landmark':
          return 'اضغط E أو المس الزر لتسجيل المعلم.';
        case 'predator_chase':
          return 'مفترس قريب! اركض (Shift) أو ادخل كوخاً أو هاجم (Q).';
        case 'night_no_light':
          return 'حلّ الليل! اضغط F أو أيقونة الإضاءة لتشغيل المصباح.';
        case 'start_explore':
          return 'استكشف الغابة والقرى والجبال. استخدم I للحقيبة و Q للدفاع.';
        case 'follow_trail':
          return 'اتبع الدرب الترابي للوصول إلى القرى والأنهار والأكواخ والأطلال.';
        default:
          return 'اتبع البوصلة في الأعلى أو افتح الحقيبة (I) لتجهيز العتاد.';
      }
    default:
      switch (tip.key) {
        case 'talk_guide':
          return 'Aproxime-se do Guia ao lado da fogueira na clareira e pressione E para iniciar.';
        case 'nearby_guide':
          return 'Pressione E ou toque no botão para conversar com o Guia.';
        case 'swimming':
          return 'Nadando pelo rio — alcance a margem seca para montar fogueiras.';
        case 'nearby_campfire':
          return 'Pressione E ou toque no botão para assar Carne Crua na fogueira.';
        case 'nearby_bed_night':
          return 'É noite! Pressione E ou toque em Deitar para dormir até o amanhecer.';
        case 'nearby_bed_day':
          return 'Cama de abrigo — só é possível dormir quando estiver à noite.';
        case 'nearby_gatherable':
          return `Pressione E ou aproxime-se para recolher ${itemName}.`;
        case 'nearby_relic':
          return 'Pressione E ou toque no botão para coletar a relíquia.';
        case 'nearby_landmark':
          return 'Pressione E ou toque no botão para registrar o marco.';
        case 'predator_chase':
          return 'Predador próximo! Corra (Shift), abrigue-se numa cabana ou ataque com Q.';
        case 'night_no_light':
          return 'A noite caiu! Pressione F ou toque no ícone de luz para acender a lanterna.';
        case 'start_explore':
          return 'Explore a selva, montanhas, rios e aldeias. Use I para inventário e Q para defender-se.';
        case 'follow_trail':
          return 'Siga as trilhas de terra para alcançar aldeias, rios, cabanas e ruínas.';
        default:
          return 'Acompanhe a bússola no topo ou abra o inventário (I) para equipar itens.';
      }
  }
}

export function formatPromptLabel(lang: LanguageCode, prompt: HudNearbyPrompt): string {
  const t = getTranslator(lang);
  if (prompt.kind === 'guide') {
    return t.hud.interactGuide;
  }
  if (prompt.kind === 'bed') {
    return t.hud.lieDown;
  }
  if (prompt.kind === 'campfire') {
    switch (lang) {
      case 'en':
        return 'Roast Meat on Campfire';
      case 'es':
        return 'Asar Carne en Hoguera';
      case 'zh':
        return '在篝火烤肉';
      case 'ja':
        return '焚き火で肉を焼く';
      case 'ar':
        return 'شواء اللحم على النار';
      default:
        return 'Assar Carne na Fogueira';
    }
  }
  if (prompt.kind === 'relic') {
    const title = t.relics[prompt.id]?.title ?? prompt.label;
    switch (lang) {
      case 'en':
        return `Collect ${title}`;
      case 'es':
        return `Recoger ${title}`;
      case 'zh':
        return `收集 ${title}`;
      case 'ja':
        return `${title} を回収`;
      case 'ar':
        return `جمع ${title}`;
      default:
        return `Coletar ${title}`;
    }
  }
  if (prompt.kind === 'landmark') {
    const title = t.landmarks[prompt.id]?.title ?? prompt.label;
    switch (lang) {
      case 'en':
        return `Inspect ${title}`;
      case 'es':
        return `Inspeccionar ${title}`;
      case 'zh':
        return `探索 ${title}`;
      case 'ja':
        return `${title} を調査`;
      case 'ar':
        return `استكشاف ${title}`;
      default:
        return `Inspecionar ${title}`;
    }
  }
  const itemName = prompt.itemId ? t.inventory.items[prompt.itemId].name : prompt.label;
  switch (lang) {
    case 'en':
      return `Pick up ${itemName}`;
    case 'es':
      return `Recoger ${itemName}`;
    case 'zh':
      return `拾取 ${itemName}`;
    case 'ja':
      return `${itemName} を拾う`;
    case 'ar':
      return `التقاط ${itemName}`;
    default:
      return `Pegar ${itemName}`;
  }
}

export function formatToastContent(
  lang: LanguageCode,
  toast: HudToast,
): { title: string; detail: string } {
  const t = getTranslator(lang);
  const itemName = toast.itemId ? t.inventory.items[toast.itemId].name : '';
  const animalName = toast.animalKey ? t.animals[toast.animalKey] : '';
  const relic = toast.relicId ? t.relics[toast.relicId] : undefined;
  const landmark = toast.landmarkId ? t.landmarks[toast.landmarkId] : undefined;

  if (lang === 'en') {
    switch (toast.key) {
      case 'expedition_started':
        return { title: 'Expedition Started', detail: 'Talk to the Guide in the clearing before heading into the jungle.' };
      case 'guide_required':
        return { title: 'Talk to the Guide First', detail: 'Approach the Guide beside the clearing campfire and press E.' };
      case 'low_food':
        return { title: 'Hunger Warning', detail: 'Food bar dropped to 20! Eat berries (R), fruit, rations, or meat.' };
      case 'starving':
        return { title: 'Starving!', detail: 'Food reached 0! Eat something right away to stop losing HP.' };
      case 'recovered_clearing':
        return { title: 'Recovered at Clearing', detail: 'Regained strength at Sun Clearing. Find weapons or shelter before night.' };
      case 'no_light':
        return { title: 'No Light Available', detail: 'Gather wood and stone to craft a torch in the inventory.' };
      case 'used_medkit':
        return { title: 'Medkit Applied', detail: '+45 HP restored immediately!' };
      case 'used_rations':
        return { title: 'Food & Water Consumed', detail: '+25 HP and +14s agility boost!' };
      case 'used_fruit':
        return { title: 'Tropical Fruit Eaten', detail: '+12 HP and +14s agility boost!' };
      case 'used_raw_meat':
        return { title: 'Raw Meat Eaten', detail: '+30 HP and +12s extra stamina!' };
      case 'used_cooked_meat':
        return { title: 'Roasted Meat Eaten', detail: '+55 HP and +20s strong energy boost!' };
      case 'used_herb':
        return { title: 'Clearing Herb Applied', detail: '+18 HP and +10s extra breath!' };
      case 'used_sweet_berry':
        return { title: 'Sweet Berries Eaten', detail: '+18 HP and +12s energy boost!' };
      case 'crafted_torch':
        return { title: 'Jungle Torch Crafted', detail: 'Torch lit and equipped in your left hand.' };
      case 'crafted_bandage':
        return { title: 'Bandage Applied', detail: '+35 HP restored using Herb & Rope!' };
      case 'crafted_campfire':
        return { title: 'Campfire Built', detail: 'Approach with Raw Meat and press E to roast it.' };
      case 'campfire_blocked':
        return { title: 'Cannot Place Here', detail: 'Move to dry open ground outside cabins and water.' };
      case 'roasted_meat':
        return { title: '+1 Roasted Meat', detail: 'Cooked on the campfire! Restores 55 HP when eaten.' };
      case 'animal_defeated':
        return { title: `${animalName} Defeated!`, detail: 'Raw meat dropped on the ground. Collect it for your bag.' };
      case 'animal_hit':
        return { title: `Hit ${animalName}`, detail: `Animal HP: ${toast.hp ?? 0}/${toast.maxHp ?? 100} (-30)` };
      case 'tree_felled':
        return { title: 'Tree Felled!', detail: 'Dropped 3 sturdy wood logs on the ground. Collect them!' };
      case 'rock_shattered':
        return { title: 'Boulder Shattered!', detail: 'Dropped 3 flint stones on the ground. Collect them!' };
      case 'relic_collected':
        return { title: `Relic Collected: ${relic?.title ?? ''}`, detail: relic?.subtitle ?? '' };
      case 'landmark_discovered':
        return { title: `Landmark Discovered: ${landmark?.title ?? ''}`, detail: landmark?.subtitle ?? '' };
      case 'item_picked_weapon':
        return { title: `+1 ${itemName}`, detail: 'Equipped in right hand. Press Q to strike animals & predators.' };
      case 'item_picked_berry':
        return { title: `+1 ${itemName}`, detail: 'Press R for quick eat (+18 HP/Energy) or open Inventory (I).' };
      case 'item_picked_generic':
        return { title: `+1 ${itemName}`, detail: 'Stored in backpack. Press I to open Inventory.' };
      case 'night_fell':
        return { title: 'Night Fell in the Jungle', detail: 'Your light turned on automatically. Press F to toggle.' };
      case 'player_hurt':
        return { title: `${animalName} Attack!`, detail: `-${toast.damage ?? 14} HP. Press Q to defend or shelter in a cabin!` };
      case 'sleep_only_night':
        return { title: 'Only at Night', detail: 'You can only lie down and sleep when night falls.' };
      case 'slept_morning':
        return { title: 'Morning Arrived', detail: 'You slept peacefully until dawn! +30 HP & full stamina restored.' };
    }
  }

  if (lang === 'es') {
    switch (toast.key) {
      case 'expedition_started':
        return { title: 'Expedición Iniciada', detail: 'Habla con el Guía en el claro antes de adentrarte en la selva.' };
      case 'guide_required':
        return { title: 'Habla con el Guía Primero', detail: 'Acércate al Guía junto a la hoguera del claro y pulsa E.' };
      case 'low_food':
        return { title: 'Alerta de Hambre', detail: '¡El alimento bajó a 20! Come bayas (R), frutas o carne.' };
      case 'starving':
        return { title: '¡Hambre Extrema!', detail: '¡Alimento en 0! Come algo pronto para no perder salud.' };
      case 'recovered_clearing':
        return { title: 'Recuperado en el Claro', detail: 'Recuperaste fuerzas en Claro del Sol. Busca armas o refugio.' };
      case 'no_light':
        return { title: 'Sin Luz Disponible', detail: 'Recoge madera y piedra para crear una antorcha en el inventario.' };
      case 'used_medkit':
        return { title: 'Botiquín Aplicado', detail: '¡+45 puntos de salud restaurados!' };
      case 'used_rations':
        return { title: 'Comida y Agua Consumidas', detail: '¡+25 salud y agilidad por 14 segundos!' };
      case 'used_fruit':
        return { title: 'Fruta Tropical Consumida', detail: '¡+12 salud y agilidad por 14 segundos!' };
      case 'used_raw_meat':
        return { title: 'Carne Cruda Consumida', detail: '¡+30 salud y energía extra por 12 segundos!' };
      case 'used_cooked_meat':
        return { title: 'Carne Asada Consumida', detail: '¡+55 salud y gran energía por 20 segundos!' };
      case 'used_herb':
        return { title: 'Hierba Aplicada', detail: '¡+18 salud y vigor extra por 10 segundos!' };
      case 'used_sweet_berry':
        return { title: 'Bayas Dulces Consumidas', detail: '¡+18 salud y energía extra por 12 segundos!' };
      case 'crafted_torch':
        return { title: 'Antorcha Creada', detail: 'Antorcha encendida y equipada en tu mano.' };
      case 'crafted_bandage':
        return { title: 'Vendaje Aplicado', detail: '¡+35 salud restaurados con Hierba y Cuerda!' };
      case 'crafted_campfire':
        return { title: 'Hoguera Encendida', detail: 'Acércate con Carne Cruda y pulsa E para asarla.' };
      case 'campfire_blocked':
        return { title: 'No se Puede Colocar Aquí', detail: 'Busca suelo firme fuera de cabañas y del agua.' };
      case 'roasted_meat':
        return { title: '+1 Carne Asada', detail: '¡Preparada en la hoguera! Restaura 55 salud al usar.' };
      case 'animal_defeated':
        return { title: `¡${animalName} Abatido!`, detail: 'Cayó carne cruda al suelo. Recógela para tu inventario.' };
      case 'animal_hit':
        return { title: `Golpe a ${animalName}`, detail: `Salud del animal: ${toast.hp ?? 0}/${toast.maxHp ?? 100} (-30)` };
      case 'tree_felled':
        return { title: '¡Árbol Derribado!', detail: 'Cayeron 3 troncos de madera al suelo. ¡Recógelos!' };
      case 'rock_shattered':
        return { title: '¡Roca Quebrada!', detail: 'Cayeron 3 piedras de sílex al suelo. ¡Recógelas!' };
      case 'relic_collected':
        return { title: `Reliquia: ${relic?.title ?? ''}`, detail: relic?.subtitle ?? '' };
      case 'landmark_discovered':
        return { title: `Hito Descubierto: ${landmark?.title ?? ''}`, detail: landmark?.subtitle ?? '' };
      case 'item_picked_weapon':
        return { title: `+1 ${itemName}`, detail: 'Equipada en la mano derecha. Pulsa Q para atacar.' };
      case 'item_picked_berry':
        return { title: `+1 ${itemName}`, detail: 'Pulsa R para comer rápido (+18 Salud) o abre el inventario (I).' };
      case 'item_picked_generic':
        return { title: `+1 ${itemName}`, detail: 'Guardado en la mochila. Pulsa I para abrir.' };
      case 'night_fell':
        return { title: 'Anocheció en la Selva', detail: 'Tu luz se encendió automáticamente. Pulsa F para alternar.' };
      case 'player_hurt':
        return { title: `¡Ataque de ${animalName}!`, detail: `-${toast.damage ?? 14} salud. ¡Usa Q o refúgiate en una cabaña!` };
      case 'sleep_only_night':
        return { title: 'Solo de Noche', detail: 'Solo es posible acostarse a dormir cuando cae la noche.' };
      case 'slept_morning':
        return { title: 'Llegó el Amanecer', detail: '¡Dormiste hasta la mañana! +30 salud y resistencia completa.' };
    }
  }

  if (lang === 'zh') {
    switch (toast.key) {
      case 'expedition_started':
        return { title: '探险开始', detail: '先与空地中的向导对话，再深入探索热带丛林。' };
      case 'guide_required':
        return { title: '请先与向导对话', detail: '靠近空地篝火旁的向导并按 E 了解生存指引。' };
      case 'low_food':
        return { title: '饥饿警告', detail: '食物降至 20！请及时食用浆果 (R)、水果、干粮或烤肉。' };
      case 'starving':
        return { title: '极度饥饿！', detail: '食物已归零！请立刻进食以免持续损失生命值。' };
      case 'recovered_clearing':
        return { title: '在阳光空地休整', detail: '体力已恢复。天黑前寻找武器或木屋庇护。' };
      case 'no_light':
        return { title: '暂无照明工具', detail: '收集木材和燧石在背包中制作火把。' };
      case 'used_medkit':
        return { title: '已使用急救包', detail: '立即恢复 45 点生命值！' };
      case 'used_rations':
        return { title: '已补充食物与水', detail: '恢复 25 点生命并获得 14 秒敏捷！' };
      case 'used_fruit':
        return { title: '已食用热带水果', detail: '恢复 12 点生命并提升敏捷 14 秒！' };
      case 'used_raw_meat':
        return { title: '已食用生肉', detail: '恢复 30 点生命并获得 12 秒活力！' };
      case 'used_cooked_meat':
        return { title: '已食用香烤肉', detail: '恢复 55 点生命并获得 20 秒充沛精力！' };
      case 'used_herb':
        return { title: '已敷用草药', detail: '恢复 18 点生命并增加 10 秒体力！' };
      case 'used_sweet_berry':
        return { title: '已食用甜浆果', detail: '恢复 18 点生命并获得 12 秒精力！' };
      case 'crafted_torch':
        return { title: '火把已制作', detail: '已点燃并装备在手中。' };
      case 'crafted_bandage':
        return { title: '绷带已使用', detail: '使用草药和绳索恢复了 35 点生命！' };
      case 'crafted_campfire':
        return { title: '篝火已搭建', detail: '携带生肉靠近并按 E 即可烤肉。' };
      case 'campfire_blocked':
        return { title: '此处无法放置', detail: '请在木屋和水域之外的干燥地面搭建。' };
      case 'roasted_meat':
        return { title: '+1 烤肉', detail: '在篝火上烤熟！食用可恢复 55 点生命。' };
      case 'animal_defeated':
        return { title: `击败了 ${animalName}！`, detail: '地上掉落了生肉，快去拾取存入背包。' };
      case 'animal_hit':
        return { title: `击中 ${animalName}`, detail: `动物生命：${toast.hp ?? 0}/${toast.maxHp ?? 100} (-30)` };
      case 'tree_felled':
        return { title: '树木倒下！', detail: '地上掉落了 3 根坚实木材，快去拾取！' };
      case 'rock_shattered':
        return { title: '岩石碎裂！', detail: '地上掉落了 3 块燧石，快去拾取！' };
      case 'relic_collected':
        return { title: `收集遗物：${relic?.title ?? ''}`, detail: relic?.subtitle ?? '' };
      case 'landmark_discovered':
        return { title: `发现地标：${landmark?.title ?? ''}`, detail: landmark?.subtitle ?? '' };
      case 'item_picked_weapon':
        return { title: `+1 ${itemName}`, detail: '已装备于右手。按 Q 攻击动物和猛兽。' };
      case 'item_picked_berry':
        return { title: `+1 ${itemName}`, detail: '按 R 快速食用 (+18 生命) 或按 I 打开背包。' };
      case 'item_picked_generic':
        return { title: `+1 ${itemName}`, detail: '已放入背包，按 I 查看。' };
      case 'night_fell':
        return { title: '丛林夜幕降临', detail: '照明已自动开启，按 F 可手动切换。' };
      case 'player_hurt':
        return { title: `${animalName} 袭击！`, detail: `生命 -${toast.damage ?? 14}。按 Q 反击或躲进木屋！` };
      case 'sleep_only_night':
        return { title: '仅限夜晚休息', detail: '只有在夜幕降临时才可以躺下睡觉。' };
      case 'slept_morning':
        return { title: '天色已亮', detail: '安稳睡到清晨！恢复 +30 生命值与全部耐力。' };
    }
  }

  if (lang === 'ja') {
    switch (toast.key) {
      case 'expedition_started':
        return { title: '探検開始', detail: '広場の案内人と話してからジャングルへ出発しよう。' };
      case 'guide_required':
        return { title: 'まず案内人と話そう', detail: '広場の焚き火そばの案内人に近づき E キーを押してください。' };
      case 'low_food':
        return { title: '空腹警告', detail: '空腹度が20まで低下！ベリー (R) や食料・肉を食べよう。' };
      case 'starving':
        return { title: '飢餓状態！', detail: '空腹度が0です！体力が減る前に何か食べてください。' };
      case 'recovered_clearing':
        return { title: '広場で回復', detail: '太陽の広場で体力を回復。夜前に武器か小屋を確保しよう。' };
      case 'no_light':
        return { title: 'ライトがありません', detail: '木材と火打石を集めてバッグでたいまつを作ろう。' };
      case 'used_medkit':
        return { title: '救急キット使用', detail: 'HPが45回復しました！' };
      case 'used_rations':
        return { title: '食料と水を摂取', detail: 'HP +25、14秒間俊敏アップ！' };
      case 'used_fruit':
        return { title: '南国フルーツを摂取', detail: 'HP +12、14秒間俊敏アップ！' };
      case 'used_raw_meat':
        return { title: '生肉を摂取', detail: 'HP +30、12秒間スタミナアップ！' };
      case 'used_cooked_meat':
        return { title: '焼き肉を摂取', detail: 'HP +55、20秒間スタミナ大幅アップ！' };
      case 'used_herb':
        return { title: '薬草を使用', detail: 'HP +18、10秒間スタミナアップ！' };
      case 'used_sweet_berry':
        return { title: '甘いベリーを摂取', detail: 'HP +18、12秒間エネルギーアップ！' };
      case 'crafted_torch':
        return { title: 'たいまつを作成', detail: '点火して手に装備しました。' };
      case 'crafted_bandage':
        return { title: '包帯を適用', detail: '薬草とロープでHPを35回復！' };
      case 'crafted_campfire':
        return { title: '焚き火を設置', detail: '生肉を持って近づき E で焼けます。' };
      case 'campfire_blocked':
        return { title: 'ここには設置できません', detail: '小屋や水辺の外の平らな地面を選んでください。' };
      case 'roasted_meat':
        return { title: '+1 焼き肉', detail: '焚き火で調理完了！食べるとHPが55回復します。' };
      case 'animal_defeated':
        return { title: `${animalName} を討伐！`, detail: '生肉が地面に落ちました。拾ってバッグへ。' };
      case 'animal_hit':
        return { title: `${animalName} に命中`, detail: `残りHP: ${toast.hp ?? 0}/${toast.maxHp ?? 100} (-30)` };
      case 'tree_felled':
        return { title: '木を伐採した！', detail: '頑丈な木材が3本地面に落ちました。拾って集めよう！' };
      case 'rock_shattered':
        return { title: '岩を砕いた！', detail: '火打石が3個地面に落ちました。拾って集めよう！' };
      case 'relic_collected':
        return { title: `遺物を回収：${relic?.title ?? ''}`, detail: relic?.subtitle ?? '' };
      case 'landmark_discovered':
        return { title: `名所を発見：${landmark?.title ?? ''}`, detail: landmark?.subtitle ?? '' };
      case 'item_picked_weapon':
        return { title: `+1 ${itemName}`, detail: '右手に装備しました。Qキーで攻撃できます。' };
      case 'item_picked_berry':
        return { title: `+1 ${itemName}`, detail: 'Rキーで即座に食べる (+18 HP) か I でバッグを開きます。' };
      case 'item_picked_generic':
        return { title: `+1 ${itemName}`, detail: 'バッグに収納しました。Iキーで確認できます。' };
      case 'night_fell':
        return { title: 'ジャングルに夜が到来', detail: 'ライトが自動点灯しました。Fキーで切替できます。' };
      case 'player_hurt':
        return { title: `${animalName} の攻撃！`, detail: `HP -${toast.damage ?? 14}。Qで反撃するか小屋に逃げよう！` };
      case 'sleep_only_night':
        return { title: '夜のみ睡眠可能', detail: '横になって眠れるのは夜の間だけです。' };
      case 'slept_morning':
        return { title: '朝になりました', detail: '夜明けまでぐっすり眠りました！HP +30・スタミナ全快。' };
    }
  }

  if (lang === 'ar') {
    switch (toast.key) {
      case 'expedition_started':
        return { title: 'بدأت الرحلة', detail: 'تحدث مع المرشد في الفسحة قبل الانطلاق إلى الغابة.' };
      case 'guide_required':
        return { title: 'تحدث مع المرشد أولاً', detail: 'اقترب من المرشد بجانب نار الفسحة واضغط E.' };
      case 'low_food':
        return { title: 'تنبيه جوع', detail: 'انخفض الغذاء إلى 20! تناول التوت (R) أو الفاكهة أو اللحم.' };
      case 'starving':
        return { title: 'جوع شديد!', detail: 'وصل الغذاء إلى 0! تناول طعاماً فوراً لتجنب فقدان الصحة.' };
      case 'recovered_clearing':
        return { title: 'تعافيت في الفسحة', detail: 'استعدت قواك في فسحة الشمس. ابحث عن سلاح أو مأوى قبل الليل.' };
      case 'no_light':
        return { title: 'لا يوجد ضوء متاح', detail: 'اجمع الخشب والحجارة لصنع مشعل من الحقيبة.' };
      case 'used_medkit':
        return { title: 'تم استخدام حقيبة الإسعاف', detail: 'استعادة +45 نقطة صحة فوراً!' };
      case 'used_rations':
        return { title: 'تم تناول الطعام والماء', detail: '+25 صحة ورشاقة لمدة 14 ثانية!' };
      case 'used_fruit':
        return { title: 'تم تناول فاكهة استوائية', detail: '+12 صحة ورشاقة لمدة 14 ثانية!' };
      case 'used_raw_meat':
        return { title: 'تم تناول لحم نيء', detail: '+30 صحة وطاقة لمدة 12 ثانية!' };
      case 'used_cooked_meat':
        return { title: 'تم تناول لحم مشوي', detail: '+55 صحة وطاقة قوية لمدة 20 ثانية!' };
      case 'used_herb':
        return { title: 'تم تطبيق عشبة الفسحة', detail: '+18 صحة ونفس إضافي لمدة 10 ثوانٍ!' };
      case 'used_sweet_berry':
        return { title: 'تم تناول التوت الحلو', detail: '+18 صحة وطاقة إضافية لمدة 12 ثانية!' };
      case 'crafted_torch':
        return { title: 'تم صنع مشعل الغابة', detail: 'أُشعل المشعل وجُهز في يدك.' };
      case 'crafted_bandage':
        return { title: 'تم تطبيق الضمادة', detail: 'استعادة +35 صحة باستخدام العشبة والحبل!' };
      case 'crafted_campfire':
        return { title: 'تم بناء المخيم', detail: 'اقترب ومعك لحم نيء واضغط E لشوائه.' };
      case 'campfire_blocked':
        return { title: 'لا يمكن الوضع هنا', detail: 'انتقل إلى أرض جافة خارج الأكواخ والمياه.' };
      case 'roasted_meat':
        return { title: '+1 لحم مشوي', detail: 'نضج على النار! يستعيد 55 صحة عند تناوله.' };
      case 'animal_defeated':
        return { title: `تم صيد ${animalName}!`, detail: 'سقط لحم نيء على الأرض. التقطه لحقيبتك.' };
      case 'animal_hit':
        return { title: `إصابة ${animalName}`, detail: `صحة الحيوان: ${toast.hp ?? 0}/${toast.maxHp ?? 100} (-30)` };
      case 'tree_felled':
        return { title: 'سقطت الشجرة!', detail: 'سقطت 3 جذوع خشب متينة على الأرض. التقطها!' };
      case 'rock_shattered':
        return { title: 'تحطمت الصخرة!', detail: 'سقطت 3 أحجار صوان على الأرض. التقطها!' };
      case 'relic_collected':
        return { title: `تم جمع الأثر: ${relic?.title ?? ''}`, detail: relic?.subtitle ?? '' };
      case 'landmark_discovered':
        return { title: `تم اكتشاف معلم: ${landmark?.title ?? ''}`, detail: landmark?.subtitle ?? '' };
      case 'item_picked_weapon':
        return { title: `+1 ${itemName}`, detail: 'مجهز في اليد اليمنى. اضغط Q للهجوم.' };
      case 'item_picked_berry':
        return { title: `+1 ${itemName}`, detail: 'اضغط R للأكل السريع (+18 صحة) أو افتح الحقيبة (I).' };
      case 'item_picked_generic':
        return { title: `+1 ${itemName}`, detail: 'حُفظ في الحقيبة. اضغط I للفتح.' };
      case 'night_fell':
        return { title: 'حل الظلام في الغابة', detail: 'أُضيء مصباحك تلقائياً. اضغط F للتبديل.' };
      case 'player_hurt':
        return { title: `هجوم من ${animalName}!`, detail: `-${toast.damage ?? 14} صحة. اضغط Q للدفاع أو احتمِ بكوخ!` };
      case 'sleep_only_night':
        return { title: 'النوم ليلاً فقط', detail: 'يمكنك الاستلقاء والنوم عند حلول الليل فقط.' };
      case 'slept_morning':
        return { title: 'أشرق الصباح', detail: 'نمت حتى الفجر! تمت استعادة +30 صحة والقدرة بالكامل.' };
    }
  }

  // Default pt-BR
  switch (toast.key) {
    case 'expedition_started':
      return { title: 'Expedição Iniciada', detail: 'Converse com o Guia na clareira antes de avançar pela selva.' };
    case 'guide_required':
      return { title: 'Fale com o Guia Primeiro', detail: 'Aproxime-se do Guia ao lado da fogueira na clareira e pressione E.' };
    case 'low_food':
      return { title: 'Alerta de Fome', detail: 'Alimento caiu para 20! Coma bagas (R), frutas, rações ou carne.' };
    case 'starving':
      return { title: 'Fome Extrema!', detail: 'Alimento chegou a 0! Coma algo agora para não perder vida.' };
    case 'recovered_clearing':
      return { title: 'Recuperado na Clareira', detail: 'Você recobrou as forças na Clareira do Sol. Busque armas ou abrigo antes da noite.' };
    case 'no_light':
      return { title: 'Sem Luz Disponível', detail: 'Colete madeira e pedra para montar uma tocha no inventário.' };
    case 'used_medkit':
      return { title: 'Kit Médico Aplicado', detail: '+45 pontos de vida restaurados imediatamente!' };
    case 'used_rations':
      return { title: 'Comida e Água Consumidas', detail: '+25 de vida e agilidade aumentada por 14 segundos!' };
    case 'used_fruit':
      return { title: 'Fruta Tropical Consumida', detail: '+12 de vida e agilidade aumentada por 14 segundos!' };
    case 'used_raw_meat':
      return { title: 'Carne Crua Consumida', detail: '+30 de vida e energia extra por 12 segundos!' };
    case 'used_cooked_meat':
      return { title: 'Carne Assada Consumida', detail: '+55 de vida e energia vigorosa por 20 segundos!' };
    case 'used_herb':
      return { title: 'Erva da Clareira Aplicada', detail: '+18 de vida e fôlego extra por 10 segundos!' };
    case 'used_sweet_berry':
      return { title: 'Bagas Doces Consumidas', detail: '+18 de vida e energia extra por 12 segundos!' };
    case 'crafted_torch':
      return { title: 'Tocha da Selva Montada', detail: 'Tocha acesa e equipada na mão do explorador.' };
    case 'crafted_bandage':
      return { title: 'Atadura Improvisada Aplicada', detail: '+35 de vida restaurados com Erva e Corda!' };
    case 'crafted_campfire':
      return { title: 'Fogueira Acesa na Mata', detail: 'Aproxime-se com Carne Crua e pressione E para assar.' };
    case 'campfire_blocked':
      return { title: 'Local Inadequado', detail: 'Afaste-se da água e do interior das cabanas para montar a fogueira.' };
    case 'roasted_meat':
      return { title: '+1 Carne Assada', detail: 'Assada na brasa! Restaura 55 de vida ao consumir.' };
    case 'animal_defeated':
      return { title: `${animalName} Abatido!`, detail: 'Carne crua caiu no chão. Colete para guardar no inventário.' };
    case 'animal_hit':
      return { title: `Golpe em ${animalName}`, detail: `Vida do animal: ${toast.hp ?? 0}/${toast.maxHp ?? 100} (-30)` };
    case 'tree_felled':
      return { title: 'Árvore Derrubada!', detail: '3 troncos de madeira caíram no chão. Colete para o inventário!' };
    case 'rock_shattered':
      return { title: 'Rocha Quebrada!', detail: '3 pedras de sílex caíram no chão. Colete para o inventário!' };
    case 'relic_collected':
      return { title: `Relíquia Coletada: ${relic?.title ?? ''}`, detail: relic?.subtitle ?? '' };
    case 'landmark_discovered':
      return { title: `Marco Descoberto: ${landmark?.title ?? ''}`, detail: landmark?.subtitle ?? '' };
    case 'item_picked_weapon':
      return { title: `+1 ${itemName}`, detail: 'Equipado na mão direita. Pressione Q para atacar animais e predadores.' };
    case 'item_picked_berry':
      return { title: `+1 ${itemName}`, detail: 'Pressione R para comer rápido (+18 Vida/Energia) ou abra o inventário (I).' };
    case 'item_picked_generic':
      return { title: `+1 ${itemName}`, detail: 'Guardado no inventário. Pressione I para abrir a mochila.' };
    case 'night_fell':
      return { title: 'Anoiteceu na Selva', detail: 'Sua luz foi acesa automaticamente. Pressione F para alternar.' };
    case 'player_hurt':
      return { title: `Ataque de ${animalName}!`, detail: `-${toast.damage ?? 14} de vida. Use Q para defender-se ou entre em uma cabana!` };
    case 'sleep_only_night':
      return { title: 'Dormir Apenas à Noite', detail: 'Só é possível deitar e dormir quando estiver à noite.' };
    case 'slept_morning':
      return { title: 'Amanheceu na Selva', detail: 'Você descansou até o dia clarear! +30 de vida e estamina restaurada.' };
  }
}
