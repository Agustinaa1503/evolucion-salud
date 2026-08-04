export type BlogSection = {
  heading?: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  /** Slugs de categorías de la taxonomía (FASE 10). */
  categories?: string[];
  /** Tags libres (FASE 10). */
  tags?: string[];
  /** Nivel de la taxonomía (FASE 10). */
  level?: string;
  /** Audiencias de la taxonomía (FASE 10). */
  audience?: string[];
  readTime: string;
  icon: string;
  gradient: string;
  image: string;
  sections: BlogSection[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'estres-prequirurgico-como-preparar-cuerpo-y-mente',
    title:
      'Estrés prequirúrgico: cómo preparar tu cuerpo y tu mente antes de una cirugía',
    excerpt:
      'La espera previa a una cirugía activa tu sistema de alerta. Te contamos qué pasa en tu cuerpo y qué puedes hacer para llegar más regulado al quirófano.',
    date: '2026-07-28',
    category: 'Preparación quirúrgica',
    categories: ['estres', 'ansiedad', 'sueno'],
    tags: ['estrés prequirúrgico', 'cortisol', 'melatonina', 'respiración vagal'],
    level: 'introductorio',
    audience: ['publico-general'],
    readTime: '8 min',
    icon: 'heart',
    gradient: 'from-brand-500 to-leaf-600',
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80",
    sections: [
      {
        heading: '¿Qué es el estrés prequirúrgico?',
        paragraphs: [
          'La espera previa a una cirugía programada es uno de los momentos de mayor activación emocional que puede atravesar una persona. No es un problema de carácter ni una falta de fortaleza: es tu sistema de alerta haciendo su trabajo.',
          'Desde la PINE (PsicoInmunoNeuroEndocrinología) entendemos que el estrés no es «mental» ni «físico» por separado: es un fenómeno biológico integral. Cuando el cerebro interpreta una amenaza, moviliza hormonas y modifica la respuesta inmunológica en segundos. El problema no es el estrés puntual: es cuando ese estado se sostiene durante semanas y desgasta tus sistemas basales.',
        ],
      },
      {
        heading: 'Las 4 variables que encienden la alarma',
        paragraphs: [
          'La respuesta de alerta se activa ante cuatro variables: la novedad, la impredecibilidad, la sensación de descontrol y la amenaza.',
          'Un diagnóstico y una cirugía programada reúnen las cuatro al mismo tiempo. Por eso el cuerpo entra en alerta máxima: es esperable que aparezcan insomnio, tensión muscular, palpitaciones, alteraciones digestivas o irritabilidad.',
          'El primer paso no es eliminar esas señales, sino reconocerlas. El autorreconocimiento es la base de cualquier estrategia de regulación: no puedes intervenir lo que no identificas.',
        ],
      },
      {
        heading: 'La mente se transforma en materia',
        paragraphs: [
          'Cuando el estado de alerta se sostiene, el cortisol elevado de forma crónica afecta el sueño, aumenta la inflamación y modula negativamente la respuesta inmune. A la vez, la melatonina —tu hormona del descanso— baja, y eso dificulta aún más la recuperación.',
          'La buena noticia es que la biología también trabaja a favor: técnicas simples de regulación como la respiración vagal pueden bajar la activación en pocos minutos, y sostener hábitos de sueño y alimentación antiinflamatoria prepara tu sistema para el momento de la cirugía.',
        ],
      },
      {
        heading: 'Qué puedes hacer hoy',
        paragraphs: [
          'Paso 1: registra. Usa la Checklist Matriz PINE para anotar cómo está tu sueño, tu tensión, tus emociones y tu red de apoyo.',
          'Paso 2: respira. Cinco minutos de respiración vagal (inhalación de 4 segundos, exhalación lenta de 6 a 8) antes de dormir y antes de las consultas médicas.',
          'Paso 3: organiza el ambioma. Elige a 2 o 3 personas de confianza para delegar, escribe tus dudas médicas y define con tu familia los límites de visitas para el regreso al hogar.',
          'Estas herramientas no reemplazan la atención médica, pero te devuelven una sensación de control que impacta directamente en tu biología.',
        ],
      },
    ],
  },
  {
    slug: 'carga-alostatica-cuando-el-estres-cronico-desgasta',
    title: 'Carga alostática: cuando el estrés crónico desgasta en silencio',
    excerpt:
      'El estrés no es el enemigo: la carga acumulada sí. Aprende a reconocer el desgaste silencioso de tu cuerpo antes de que se convierta en enfermedad.',
    date: '2026-07-21',
    category: 'PINE',
    categories: ['estres', 'estres-cronico', 'pine'],
    tags: ['carga alostática', 'alostasis', 'cortisol', 'estrategias de regulación'],
    level: 'inicial',
    audience: ['publico-general'],
    readTime: '7 min',
    icon: 'waves',
    gradient: 'from-sky-500 to-indigo-600',
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1600&q=80",
    sections: [
      {
        heading: 'La diferencia entre estrés y carga alostática',
        paragraphs: [
          'El estrés es una respuesta adaptativa: te prepara para actuar, para protegerte, para responder a un desafío. El problema aparece cuando esa respuesta se vuelve permanente.',
          'La alostasis es el proceso por el cual tu cuerpo mantiene la estabilidad frente a los cambios. Cuando las demandas son muchas, sostenidas o repetidas, el sistema paga un costo: eso es la carga alostática, el desgaste acumulado de estar en alerta durante demasiado tiempo.',
        ],
      },
      {
        heading: 'Señales que tu cuerpo te está dando',
        paragraphs: [
          'La carga alostática no aparece con un cartel luminoso. Se expresa en señales concretas: sueño fragmentado, despertares con cansancio, tensión en cuello y espalda, palpitaciones, alteraciones digestivas, irritabilidad o dificultad para concentrarte.',
          'Lo importante es entender que no son «flojera» ni «exageración»: son tu sistema nervioso, tus hormonas y tu inmunidad comunicándose. Aprender a escucharlas es el primer acto de autocuidado.',
        ],
      },
      {
        heading: 'El costo invisible de acompañar',
        paragraphs: [
          'La carga alostática también afecta a quienes cuidan. El referente familiar de una persona con un diagnóstico acumula su propio desgaste, muchas veces en silencio, porque «hay que estar fuerte» por el otro.',
          'En la PINE llamamos ambioma al entorno que rodea a la persona: familia, hogar, red social. Cuidar el ambioma no es un extra: es parte del tratamiento del paciente y de la salud de todo el sistema.',
        ],
      },
      {
        heading: 'Cómo empezar a descargar',
        paragraphs: [
          'Regula el descanso antes que todo: horarios fijos de sueño y luz tenue por la noche son la base.',
          'Muévete con regularidad: caminar al aire libre modula el cortisol y favorece la melatonina.',
          'Pon límites: las visitas, los mensajes y las demandas laborales pueden esperar. Tu recuperación no.',
          'Y si acompañas a alguien, haz tu propio proceso: la guía para el cuidador existe porque tu bienestar también importa.',
        ],
      },
    ],
  },
  {
    slug: 'melatonina-y-sueno-la-hormona-que-prepara-tu-cuerpo-para-sanar',
    title: 'Melatonina y sueño: la hormona que prepara tu cuerpo para sanar',
    excerpt:
      'La melatonina es mucho más que la «hormona del sueño». Te contamos su rol en la recuperación y qué hábitos la protegen.',
    date: '2026-07-14',
    category: 'Sueño y descanso',
    categories: ['sueno', 'cronobiologia'],
    tags: ['melatonina', 'sueño', 'recuperación', 'higiene del sueño'],
    level: 'introductorio',
    audience: ['publico-general'],
    readTime: '6 min',
    icon: 'moon',
    gradient: 'from-violet-500 to-purple-700',
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
    sections: [
      {
        heading: '¿Qué es la melatonina?',
        paragraphs: [
          'La melatonina es una hormona que produce tu propio cuerpo, principalmente en la glándula pineal, cuando cae la luz. Es la señal que le dice a tu organismo que es momento de descansar y repararse.',
          'Además de sincronizar tu reloj biológico, la melatonina participa en la regulación de la respuesta inmune y tiene propiedades antioxidantes y antiinflamatorias. Por eso su rol en contextos de enfermedad y recuperación es tan importante.',
        ],
      },
      {
        heading: 'Sueño y reparación celular',
        paragraphs: [
          'Durante el sueño profundo, tu cuerpo activa procesos de reparación celular, consolida la memoria y regula el sistema inmune. Dormir mal no es solo «estar cansado»: es perder la ventana diaria de mantenimiento de tu organismo.',
          'En la PINE entendemos el sueño como un pilar terapéutico: sin descanso adecuado, cualquier otra intervención rinde menos.',
        ],
      },
      {
        heading: 'Melatonina en el contexto perioperatorio',
        paragraphs: [
          'En el contexto de una cirugía programada, la calidad del sueño previo influye en tu equilibrio inmunológico y en tu capacidad de afrontamiento. La melatonina ha sido estudiada como coadyuvante en la modulación de la ansiedad prequirúrgica y en la protección del sistema PINE.',
          'Importante: la melatonina como suplemento debe indicarla un profesional de la salud, evaluando tu caso particular. Acá hablamos de psicoeducación, no de automedicación.',
        ],
      },
      {
        heading: 'Higiene de sueño: lo que sí puedes hacer hoy',
        paragraphs: [
          'Horarios regulares: acostarte y levantarte a la misma hora entrena a tu reloj biológico.',
          'Luz tenue después de las 22 h y evitar pantallas brillantes antes de dormir.',
          'Un ambiente fresco, oscuro y silencioso en tu habitación.',
          'Cuidar la cafeína y las comidas pesadas en la noche.',
          'Si la mente no para, anotá tus preocupaciones en papel: sacarlas de la cabeza también es biología.',
        ],
      },
    ],
  },
  {
    slug: 'cronobiologia-por-que-tu-reloj-interno-decide-como-te-recuperas',
    title: 'Cronobiología: por qué tu reloj interno decide cómo te recuperas',
    excerpt:
      'Luz, comidas, descanso y actividad: tu cuerpo sigue un ritmo de aproximadamente 24 horas. Alinearte con él puede cambiar tu recuperación.',
    date: '2026-07-07',
    category: 'Cronobiología',
    categories: ['cronobiologia', 'sueno'],
    tags: ['cronobiología', 'ritmo circadiano', 'melatonina', 'luz'],
    level: 'inicial',
    audience: ['publico-general'],
    readTime: '7 min',
    icon: 'clock',
    gradient: 'from-amber-500 to-orange-600',
    image: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=1600&q=80",
    sections: [
      {
        heading: 'Tu cuerpo tiene un reloj',
        paragraphs: [
          'Casi todas las células de tu cuerpo siguen un ritmo circadiano: un ciclo de aproximadamente 24 horas regulado por un reloj central en tu cerebro y por señales externas, sobre todo la luz.',
          'Ese reloj coordina cuándo tienes sueño, cuándo tu digestión está más activa, cuándo tu temperatura sube o baja, y cómo se comporta tu sistema inmune a lo largo del día.',
        ],
      },
      {
        heading: 'Luz, comida y descanso',
        paragraphs: [
          'La luz es el sincronizador más potente: la luz natural por la mañana adelanta tu reloj y mejora tu energía; la luz brillante de las pantallas por la noche lo retrasa y empobrece tu sueño.',
          'Las comidas también dan pistas a tu cuerpo: comer siempre cerca de los mismos horarios ayuda a anclar el ritmo. En cambio, la alimentación caótica y nocturna confunde al reloj biológico.',
        ],
      },
      {
        heading: 'Cronobiología perioperatoria',
        paragraphs: [
          'Antes de una cirugía, estabilizar tus ritmos circadianos es una forma concreta de preparar tu equilibrio inmunológico: mejor descanso, mejor regulación del cortisol y mayor capacidad de afrontamiento.',
          'Después de la cirugía, respetar el ritmo día-noche —incluido poner límites a las visitas para proteger el descanso— acelera la recuperación. Eso no es un capricho: es cronobiología aplicada.',
        ],
      },
      {
        heading: 'Tres ajustes para arrancar hoy',
        paragraphs: [
          'Toma 15 minutos de luz natural a la mañana.',
          'Fija horarios de comida y de sueño, y mantenlos los fines de semana.',
          'Bajá la intensidad de luces y pantallas una hora antes de dormir.',
          'Tu reloj biológico es uno de tus mejores aliados: solo necesita que lo escuches.',
        ],
      },
    ],
  },
  {
    slug: 'cirugia-despierta-que-es-el-mapeo-cortical',
    title:
      'Cirugía despierta: qué es el mapeo cortical y por qué no deberías temerle',
    excerpt:
      'La craneotomía con paciente despierto suena aterradora, pero es una de las técnicas más precisas para proteger el cerebro. Te la explicamos simple.',
    date: '2026-06-30',
    category: 'Neurocirugía',
    categories: ['neurociencias', 'profesionales-de-la-salud'],
    tags: ['cirugía despierta', 'mapeo cortical', 'neuropsicología', 'quirófano'],
    level: 'intermedio',
    audience: ['profesionales-de-la-salud', 'psicologos'],
    readTime: '9 min',
    icon: 'brain',
    gradient: 'from-leaf-500 to-leaf-800',
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80",
    sections: [
      {
        heading: '¿En qué consiste la cirugía con paciente despierto?',
        paragraphs: [
          'Durante ciertas cirugías de cerebro (por ejemplo, para tumores cerca de áreas del lenguaje o la motricidad), el paciente permanece despierto durante parte del procedimiento. La anestesia maneja el dolor y la incomodidad, pero la persona puede hablar, mover la mano o nombrar objetos cuando se le pide.',
          'Parece una paradoja, pero tiene una razón precisa: mientras el cirujano reseca el tumor, el equipo necesita «mapear» las funciones elocuentes del cerebro —el lenguaje, la motricidad, la sensopercepción— para no dañarlas.',
        ],
      },
      {
        heading: 'El rol del neuropsicólogo en quirófano',
        paragraphs: [
          'Acá entra la neuropsicología intraquirúrgica: durante la cirugía, el neuropsicólogo diseña y administra pruebas personalizadas según la historia vital del paciente. No son tests genéricos: se adaptan a lo que esa persona aprendió, a su cultura y a sus emociones.',
          'Mientras el cirujano estimula zonas del cerebro, el paciente realiza tareas y el equipo observa en tiempo real qué funciones se conservan. Es un trabajo de altísima precisión que humaniza la alta complejidad.',
        ],
      },
      {
        heading: 'Por qué el paciente está despierto',
        paragraphs: [
          'Porque es la forma más segura de proteger funciones que hacen a la identidad de una persona: hablar, entender, moverse, recordar. La participación activa del paciente resguarda lo que más importa.',
          'Además, el cerebro no siente dolor en su interior: la apertura del cráneo se realiza con anestesia local y el paciente no experimenta dolor durante la estimulación.',
        ],
      },
      {
        heading: 'Cómo prepararse desde la PINE',
        paragraphs: [
          'Saber qué va a pasar reduce el miedo a lo desconocido. Pregunta a tu equipo médico, pide que te expliquen cada etapa y lleva a alguien de confianza que registre la información.',
          'Desde la PINE, la preparación psicoeducativa —entender el procedimiento, practicar la respiración y organizar el ambioma— transforma una experiencia que da miedo en una experiencia de colaboración activa con tu propio equipo médico.',
          'No estás solo en el quirófano: estás participando de tu propio cuidado. Y eso, biológicamente, también es medicina.',
        ],
      },
    ],
  },
  {
    slug: 'estres-del-cuidador-cuidar-al-que-cuida',
    title: 'Estrés del cuidador: cuidar al que cuida también es parte del proceso',
    excerpt:
      'Quien acompaña también acumula carga alostática. Aprende a reconocer las señales y a sostenerte sin culpa.',
    date: '2026-06-23',
    category: 'Ambioma familiar',
    categories: ['estres', 'emociones', 'relaciones-interpersonales'],
    tags: ['cuidador', 'ambioma', 'carga alostática', 'límites'],
    level: 'inicial',
    audience: ['publico-general'],
    readTime: '7 min',
    icon: 'heart',
    gradient: 'from-pink-500 to-rose-600',
    image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1600&q=80",
    sections: [
      {
        heading: 'El cuidador también acumula carga',
        paragraphs: [
          'Cuando alguien recibe un diagnóstico o se enfrenta a una cirugía, toda la familia entra en estado de alerta. Pero el referente familiar —el que acompaña, organiza, espera y sostiene— vive una doble exposición: la preocupación por el otro más el desgaste de cuidar.',
          'En la PINE sabemos que el estrés es transversal: la carga alostática del cuidador impacta en su propia salud y, a la vez, en la recuperación de la persona cuidada. Cuidar al que cuida no es un lujo: es parte del proceso.',
        ],
      },
      {
        heading: 'Señales de alarma en quien acompaña',
        paragraphs: [
          'Insomnio o despertares con cansancio extremo, contracturas y dolores de cabeza, alteraciones digestivas, irritabilidad, menos paciencia, dificultad para concentrarse o sensación de aislamiento.',
          'Si te reconoces en varias de estas señales, no estás fallando: estás acumulando carga. Y la buena noticia es que la carga se puede descargar.',
        ],
      },
      {
        heading: 'Límites saludables: no es egoísmo',
        paragraphs: [
          'Poner límites a las visitas, pedir ayuda concreta (que cocinen, que cubran un turno, que atiendan la casa) y reservarte momentos de descanso no es egoísmo: es sostener tu capacidad de cuidar a largo plazo.',
          'El ambioma se organiza como un equipo: delegar, repartir y comunicar los miedos en el núcleo familiar son herramientas biológicas de protección.',
        ],
      },
      {
        heading: 'Herramientas PINE para el ambioma',
        paragraphs: [
          'Haz tu propio registro de autorreconocimiento: tu sueño, tu tensión y tus emociones también cuentan.',
          'Practica respiración vagal: 5 minutos, dos veces al día, cambian tu biología de la alerta a la calma.',
          'Busca tu propia red de contención: otros cuidadores, profesionales, grupos de apoyo.',
          'Y recuerda: si tú te sostienes, tu persona cuidada se recupera mejor. Tu bienestar es parte del tratamiento.',
        ],
      },
    ],
  },
];

export const getBlogPost = (slug: string): BlogPost | undefined =>
  blogPosts.find((p) => p.slug === slug);

export const featuredPosts: BlogPost[] = blogPosts.slice(0, 3);
