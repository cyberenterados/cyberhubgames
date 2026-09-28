/**
 * ============================================================================
 * CUMPLEAÑOS ESOTÉRICO & ORÁCULO VÉDICO - MOTOR PRINCIPAL (VANILLA JS)
 * Arquitectura Modular, Escalable, Libre de Dependencias
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. MOTOR ASTRONÓMICO & ASTROLÓGICO (ASTRO_ENGINE)
     ========================================================================== */
  const ASTRO_ENGINE = {
    
    /**
     * Calcula la edad exacta con años, meses, días, días totales y próximo cumpleaños.
     */
    calculateAge(birthDateStr) {
      const birth = new Date(birthDateStr + 'T00:00:00');
      const now = new Date();

      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      let days = now.getDate() - birth.getDate();

      if (days < 0) {
        months -= 1;
        // Días en el mes anterior
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
      }

      if (months < 0) {
        years -= 1;
        months += 12;
      }

      // Días totales de vida
      const diffTime = Math.abs(now.getTime() - birth.getTime());
      const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Lunas llenas presenciadas (~29.53 días por ciclo sinódico)
      const moonsSeen = Math.floor(totalDays / 29.530588);

      // Días para el próximo cumpleaños
      let nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
      if (now > nextBday) {
        nextBday.setFullYear(now.getFullYear() + 1);
      }
      const daysToNextBday = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        years: Math.max(0, years),
        months: Math.max(0, months),
        days: Math.max(0, days),
        totalDays,
        moonsSeen,
        daysToNextBday
      };
    },

    /**
     * Determina el signo zodiacal tradicional, elemento, cualidad, regente y Rashi Védico.
     */
    getZodiacData(month, day) {
      // month: 1 - 12, day: 1 - 31
      const signs = [
        { name: 'Capricornio', glyph: '♑', element: 'Tierra', modality: 'Cardinal', ruler: 'Saturno', start: [1, 1], end: [1, 19], rashi: 'Makara (मकर)', vedicLord: 'Shani (Saturno)', vedicDesc: 'Enfoque kármico en la disciplina, la paciencia y la construcción de templos interiores duraderos.' },
        { name: 'Acuario', glyph: '♒', element: 'Aire', modality: 'Fijo', ruler: 'Urano y Saturno', start: [1, 20], end: [2, 18], rashi: 'Kumbha (कुम्भ)', vedicLord: 'Shani / Rahu', vedicDesc: 'El portador del cántaro del néctar celestial. Mente visionaria y servicio al despertar de la humanidad.' },
        { name: 'Piscis', glyph: '♓', element: 'Agua', modality: 'Mutable', ruler: 'Neptuno y Júpiter', start: [2, 19], end: [3, 20], rashi: 'Meena (मीन)', vedicLord: 'Guru (Júpiter)', vedicDesc: 'Las dos corrientes de la conciencia. Gran compasión mística, disolución del ego y conexión con el océano universal.' },
        { name: 'Aries', glyph: '♈', element: 'Fuego', modality: 'Cardinal', ruler: 'Marte', start: [3, 21], end: [4, 19], rashi: 'Mesha (मेष)', vedicLord: 'Mangala (Marte)', vedicDesc: 'La chispa divina de la creación (Tejas). Fuerza iniciadora, valentía sagrada y espíritu del guerrero de luz.' },
        { name: 'Tauro', glyph: '♉', element: 'Tierra', modality: 'Fijo', ruler: 'Venus', start: [4, 20], end: [5, 20], rashi: 'Vrishabha (वृषभ)', vedicLord: 'Shukra (Venus)', vedicDesc: 'Estabilidad de la madre tierra (Prithvi). Anclaje en la belleza, lealtad inquebrantable y abundancia material y espiritual.' },
        { name: 'Géminis', glyph: '♊', element: 'Aire', modality: 'Mutable', ruler: 'Mercurio', start: [5, 21], end: [6, 20], rashi: 'Mithuna (मिथुन)', vedicLord: 'Budha (Mercurio)', vedicDesc: 'El puente entre dos mundos. Curiosidad sagrada, comunicación elocuente y transmisión de conocimientos ocultos.' },
        { name: 'Cáncer', glyph: '♋', element: 'Agua', modality: 'Cardinal', ruler: 'La Luna', start: [6, 21], end: [7, 22], rashi: 'Karka (कर्क)', vedicLord: 'Chandra (La Luna)', vedicDesc: 'El santuario del corazón (Hridaya). Devoción protectora, memoria del linaje y una intuición psíquica insondable.' },
        { name: 'Leo', glyph: '♌', element: 'Fuego', modality: 'Fijo', ruler: 'El Sol', start: [7, 23], end: [8, 22], rashi: 'Simha (सिंह)', vedicLord: 'Surya (El Sol)', vedicDesc: 'El rugido del alma divina (Atman). Generosidad regia, fuego creador y liderazgo basado en el dharma.' },
        { name: 'Virgo', glyph: '♍', element: 'Tierra', modality: 'Mutable', ruler: 'Mercurio', start: [8, 23], end: [9, 22], rashi: 'Kanya (कन्या)', vedicLord: 'Budha (Mercurio)', vedicDesc: 'La pureza de la devoción y el servicio (Seva). Discernimiento analítico, sanación natural y refinamiento del ser.' },
        { name: 'Libra', glyph: '♎', element: 'Aire', modality: 'Cardinal', ruler: 'Venus', start: [9, 23], end: [10, 22], rashi: 'Tula (तुला)', vedicLord: 'Shukra (Venus)', vedicDesc: 'La balanza cósmica de la armonía. Búsqueda de la verdad, justicia divina y belleza en las relaciones sagradas.' },
        { name: 'Escorpio', glyph: '♏', element: 'Agua', modality: 'Fijo', ruler: 'Plutón y Marte', start: [10, 23], end: [11, 21], rashi: 'Vrischika (वृश्चिक)', vedicLord: 'Mangala / Ketu', vedicDesc: 'Las aguas profundas de la transmutación (Kundalini). Alquimia espiritual, penetración psicológica y renacimiento místico.' },
        { name: 'Sagitario', glyph: '♐', element: 'Fuego', modality: 'Mutable', ruler: 'Júpiter', start: [11, 22], end: [12, 21], rashi: 'Dhanu (धनु)', vedicLord: 'Guru (Júpiter)', vedicDesc: 'La flecha apuntando a lo infinito. Filosofía superior, búsqueda del Dharma y optimismo guiado por la providencia.' },
        { name: 'Capricornio', glyph: '♑', element: 'Tierra', modality: 'Cardinal', ruler: 'Saturno', start: [12, 22], end: [12, 31], rashi: 'Makara (मकर)', vedicLord: 'Shani (Saturno)', vedicDesc: 'Enfoque kármico en la disciplina, la paciencia y la construcción de templos interiores duraderos.' }
      ];

      for (const sign of signs) {
        const [startM, startD] = sign.start;
        const [endM, endD] = sign.end;

        if (
          (month === startM && day >= startD) ||
          (month === endM && day <= endD)
        ) {
          return sign;
        }
      }

      return signs[0];
    },

    /**
     * Calcula la fase lunar astronómica para una fecha dada (Algoritmo de Conway / Sinódico).
     */
    getMoonPhase(year, month, day) {
      let r = year % 100;
      r %= 19;
      if (r > 9) { r -= 19; }
      r = ((r * 11) % 30) + parseInt(month) + parseInt(day);
      if (month < 3) { r += 2; }
      r -= (year < 2000) ? 4 : 8.3;
      r = Math.floor(r + 0.5) % 30;
      if (r < 0) { r += 30; }

      // r representa los días del ciclo lunar (0 - 29.5)
      const phaseIndex = Math.floor((r / 30) * 8) % 8;
      const illumination = Math.round((1 - Math.cos((r / 30) * 2 * Math.PI)) / 2 * 100);

      const phases = [
        {
          name: 'Luna Nueva (Amavasya)',
          glyph: '🌑',
          archetype: 'El Sembrador Intuitivo',
          desc: 'Naciste en el vacío fecundo de la noche. Tu alma posee una intuición pura, instinto visionario y la bendición de iniciar grandes ciclos de transformación sin temor a la oscuridad.'
        },
        {
          name: 'Luna Creciente Iluminante',
          glyph: '🌒',
          archetype: 'El Guerrero de la Fe',
          desc: 'Naciste cuando la luz comenzaba a abrirse paso. Tu camino es de superación, valentía y persistencia para manifestar tus ideales frente a cualquier obstáculo terrenal.'
        },
        {
          name: 'Cuarto Creciente',
          glyph: '🌓',
          archetype: 'El Constructor del Destino',
          desc: 'Naciste bajo una tensión creativa sagrada. Eres un alquimista de la acción: tomas decisiones firmes, rompes viejas estructuras y eriges cimientos sólidos para tu vida.'
        },
        {
          name: 'Luna Gibosa Creciente',
          glyph: '🌔',
          archetype: 'El Discípulo Devoto',
          desc: 'Naciste en el momento del refinamiento. Buscas la excelencia, el conocimiento profundo y la maestría en todo lo que emprendes, guiado por un anhelo de servir al bien mayor.'
        },
        {
          name: 'Luna Llena (Purnima)',
          glyph: '🌕',
          archetype: 'El Iluminador Consciente',
          desc: 'Naciste en el clímax de la radiación celestial. Posees una alta sensibilidad psíquica, capacidad de inspirar a multitudes y la misión de traer a la luz lo que permanece oculto.'
        },
        {
          name: 'Luna Gibosa Menguante',
          glyph: '🌖',
          archetype: 'El Sabio Filósofo',
          desc: 'Naciste en el tiempo de la cosecha espiritual. Tu propósito es compartir sabiduría, enseñar a otros lo aprendido y sintetizar las grandes lecciones de la existencia.'
        },
        {
          name: 'Cuarto Menguante',
          glyph: '🌗',
          archetype: 'El Sanador Alquimista',
          desc: 'Naciste en la hora de soltar y purificar. Posees el don de discernir qué debe ser liberado y cómo trascender apegos para elevar la frecuencia de tu linaje.'
        },
        {
          name: 'Luna Balsámica',
          glyph: '🌘',
          archetype: 'El Místico Profeta',
          desc: 'Naciste en el suspiro final del ciclo lunar. Tu espíritu es antiguo, meditativo y conectado con dimensiones sutiles. Eres un canal de paz y renacimiento.'
        }
      ];

      const selected = phases[phaseIndex];
      return {
        ...selected,
        dayOfCycle: r,
        illumination
      };
    },

    /**
     * Calcula los 4 Biorritmos principales (Físico, Emocional, Intelectual, Espiritual).
     */
    calculateBiorhythms(birthDateStr) {
      const birth = new Date(birthDateStr + 'T00:00:00');
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

      // Fórmulas sinusoidales normalizadas a 0 - 100%
      const physical = Math.round(((Math.sin((2 * Math.PI * diffDays) / 23) + 1) / 2) * 100);
      const emotional = Math.round(((Math.sin((2 * Math.PI * diffDays) / 28) + 1) / 2) * 100);
      const intellectual = Math.round(((Math.sin((2 * Math.PI * diffDays) / 33) + 1) / 2) * 100);
      const spiritual = Math.round(((Math.sin((2 * Math.PI * diffDays) / 38) + 1) / 2) * 100);

      return {
        physical: Math.max(5, Math.min(100, physical)),
        emotional: Math.max(5, Math.min(100, emotional)),
        intellectual: Math.max(5, Math.min(100, intellectual)),
        spiritual: Math.max(5, Math.min(100, spiritual))
      };
    }
  };

  /* ==========================================================================
     2. MOTOR DE NUMEROLOGÍA SAGRADA (NUMEROLOGY_ENGINE)
     ========================================================================== */
  const NUMEROLOGY_ENGINE = {
    
    /**
     * Reduce un número a un solo dígito protegiendo los números maestros 11, 22 y 33.
     */
    reduceToSingle(n) {
      while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
        n = n.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
      }
      return n;
    },

    /**
     * Calcula el Número de Camino de Vida (Life Path Number).
     */
    calculateLifePath(birthDateStr) {
      const parts = birthDateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      const rDay = this.reduceToSingle(day);
      const rMonth = this.reduceToSingle(month);
      const rYear = this.reduceToSingle(year);

      let total = rDay + rMonth + rYear;
      total = this.reduceToSingle(total);

      const meanings = {
        1: {
          title: 'El Pionero & Líder Solar',
          desc: 'Tu misión es abrir nuevos senderos donde otros ven abismos. Encarnas la fuerza de la voluntad, la originalidad creativa y la autosuficiencia espiritual.',
          gift: 'Valentía para dar el primer paso, visión independiente y magnetismo pionero.',
          karma: 'Vencer el egoísmo, cultivar la paciencia y liderar con amor en vez de imposición.'
        },
        2: {
          title: 'El Diplomático & Sanador del Corazón',
          desc: 'Tu sendero es la reconciliación y el tejido de puentes de amor. Posees una receptividad psíquica única y la habilidad de traer paz a entornos caóticos.',
          gift: 'Empatía sublime, don de mediación, sensibilidad estética y lealtad incondicional.',
          karma: 'Aprender a establecer límites firmes y no diluirte en las necesidades ajenas.'
        },
        3: {
          title: 'El Artista & Portador de Alegría',
          desc: 'Vienes a elevar la vibración del mundo a través de la creatividad, la palabra sagrada, la música o el arte. La luz del entusiasmo fluye a través de tus poros.',
          gift: 'Elocuencia inspiradora, imaginación fértil y optimismo contagioso.',
          karma: 'Canalizar el foco para no dispersar tus dones en demasiados frentes.'
        },
        4: {
          title: 'El Maestro Arquitecto & Anclaje Terrenal',
          desc: 'Tu propósito es manifestar lo invisible en estructuras duraderas y ordenadas. Eres el pilar de estabilidad, honestidad y justicia en el plano material.',
          gift: 'Disciplina implacable, lealtad de roca, visión metódica y gran capacidad de trabajo.',
          karma: 'Flexibilizar la mente y confiar en la providencia cósmica ante los cambios.'
        },
        5: {
          title: 'El Espíritu Libre & Explorador Cósmico',
          desc: 'Tu destino es la transformación continua a través de la experiencia vivencial. Amas la libertad, el viaje, el descubrimiento y la renovación del pensamiento.',
          gift: 'Adaptabilidad instantánea, mente progresista y magnetismo aventurero.',
          karma: 'Dominar la templanza y no confundir la libertad sagrada con la evasión.'
        },
        6: {
          title: 'El Guardián del Hogar & Amor Devocional',
          desc: 'Encarnas el arquetipo de la maternidad/paternidad cósmica. Vienes a proteger, nutrir, embellecer los espacios y enseñar la verdad del amor incondicional.',
          gift: 'Generosidad sanadora, sentido innato de la armonía y nobleza de espíritu.',
          karma: 'Evitar el perfeccionismo y comprender que cada alma tiene su propio ritmo de evolución.'
        },
        7: {
          title: 'El Místico Buscador de la Verdad',
          desc: 'Tu mente es un templo de sabiduría secreta. Te atrae la metafísica, la introspección, la filosofía y la comunión solitaria con lo sagrado.',
          gift: 'Penetración analítica e intuitiva, discernimiento espiritual y profundidad filosófica.',
          karma: 'No aislarte del mundo terrenal y abrir tu corazón a la cercanía humana.'
        },
        8: {
          title: 'El Soberano & Alquimista de la Abundancia',
          desc: 'Posees el mandato cósmico de dominar las leyes del intercambio de energía: dinero, liderazgo, autoridad y realización de grandes proyectos materiales.',
          gift: 'Poder de manifestación, visión estratégica, eficiencia y templanza bajo presión.',
          karma: 'Usar el poder siempre como servidor de la justicia y no de la ambición desmedida.'
        },
        9: {
          title: 'El Sabio Filántropo & Amor Universal',
          desc: 'Has alcanzado la cima de la espiral numérica. Tu misión abraza a toda la humanidad; eres compasión universal, desapego y guía de conciencias.',
          gift: 'Visión humanitaria global, carisma espiritual, perdón y don artístico sublime.',
          karma: 'Aprender el arte del desapego total y no cargar sufrimientos que no te corresponden.'
        },
        11: {
          title: 'Número Maestro: El Canal Iluminador',
          desc: 'Un número de alta vibración espiritual. Eres una antena cósmica viviente, canal de inspiración superior y guía moral que despierta la fe en los demás.',
          gift: 'Clarividencia natural, intuición fulgurante y capacidad de elevar la frecuencia colectiva.',
          karma: 'Cuidar tu sistema nervioso y confiar en tu propia luz sin dudar de tu don divino.'
        },
        22: {
          title: 'Número Maestro: El Constructor Universal',
          desc: 'El arquitecto de sueños imposibles. Tienes el poder de unir la más alta espiritualidad con la máxima eficacia práctica para crear instituciones que beneficien a millones.',
          gift: 'Poder de manifestación colosal, liderazgo visionario y pragmatismo sagrado.',
          karma: 'Superar la abrumación ante la magnitud de tu misión y mantener la humildad intacta.'
        },
        33: {
          title: 'Número Maestro: El Guía de la Compasión Crística',
          desc: 'La vibración más excelsa del amor en servicio. Dedicación total a la sanación del sufrimiento del mundo mediante la presencia, la sabiduría y el amor absoluto.',
          gift: 'Sanación energética, devoción radiante y protección espiritual inalterable.',
          karma: 'Cuidar de ti mismo para no inmolarte en el altar del servicio a los demás.'
        }
      };

      const info = meanings[total] || meanings[9];
      return {
        number: total,
        ...info
      };
    }
  };

  /* ==========================================================================
     3. MOTOR DEL TAROT DEL DÍA (TAROT_ENGINE)
     ========================================================================== */
  const TAROT_ENGINE = {
    majorArcana: [
      { num: '0', name: 'El Loco', icon: '🌀', keywords: 'Nuevos comienzos, fe ciega, espontaneidad pura', upright: 'Es tiempo de dar un salto de fe cuántico. El universo te invita a confiar en lo desconocido y despojarte del miedo.', advice: 'Abre tu mente a lo inesperado y camina ligero de equipaje terrenal.' },
      { num: 'I', name: 'El Mago', icon: '🪄', keywords: 'Manifestación, destreza, voluntad creadora', upright: 'Tienes sobre tu mesa todos los elementos necesarios para materializar tu visión. Tu intención hoy es sagrada.', advice: 'Alinea tu palabra con tus actos; lo que proyectas hoy tomará forma.' },
      { num: 'II', name: 'La Sacerdotisa', icon: '🌙', keywords: 'Intuición, misterio, silencio sagrado', upright: 'El velo entre mundos es delgado. Las respuestas que buscas no están en el ruido exterior sino en tu santuario interno.', advice: 'Escucha el susurro de tus sueños y confía en tus presentimientos.' },
      { num: 'III', name: 'La Emperatriz', icon: '🪷', keywords: 'Abundancia, fertilidad, creatividad radiante', upright: 'Florecimiento absoluto. Tus proyectos y relaciones entran en un ciclo fértil lleno de gozo, belleza y placer.', advice: 'Nutre tus creaciones y permítete disfrutar de la abundancia del cosmos.' },
      { num: 'IV', name: 'El Emperador', icon: '👑', keywords: 'Estructura, autoridad, protección firme', upright: 'Momento de poner orden y establecer bases firmes. Eres el dueño soberano de tu reino personal y tus decisiones.', advice: 'Actúa con disciplina, define tus límites y defiende tu visión con serenidad.' },
      { num: 'V', name: 'El Sumo Sacerdote', icon: '📿', keywords: 'Sabiduría ancestral, guía espiritual, ética', upright: 'Conexión con las tradiciones sabias y maestros de luz. Un consejo espiritual oportuno te traerá gran paz mental.', advice: 'Busca el conocimiento que trasciende el tiempo y actúa según tu brújula moral.' },
      { num: 'VI', name: 'Los Enamorados', icon: '❤️', keywords: 'Elección del alma, unión, armonía sagrada', upright: 'Una encrucijada donde debes decidir con el corazón y no con el miedo. Atracción magnética y sincronicidad.', advice: 'Elige siempre el camino que expande tu capacidad de amar con honestidad.' },
      { num: 'VII', name: 'El Carro', icon: '🏇', keywords: 'Victoria, autodominio, avance imparable', upright: 'Fuerzas opuestas son unificadas bajo tu voluntad. La victoria te pertenece si mantienes el rumbo firme sin dudar.', advice: 'Toma las riendas de tu destino y avanza con determinación inquebrantable.' },
      { num: 'VIII', name: 'La Fuerza', icon: '🦁', keywords: 'Compasión, serenidad, dominio interior', upright: 'La verdadera fuerza no es la violencia sino la gentileza del corazón que amansa al león de las pasiones.', advice: 'Responde a los desafíos con paciencia, empatía y calma invencible.' },
      { num: 'IX', name: 'El Ermitaño', icon: '🏮', keywords: 'Luz interior, introspección, soledad fértil', upright: 'La linterna de tu alma ilumina el siguiente paso. Un momento de retiro y silencio te revelará tesoros ocultos.', advice: 'Date permiso para estar contigo mismo; en la quietud hallarás tu verdad.' },
      { num: 'X', name: 'La Rueda de la Fortuna', icon: '☸️', keywords: 'Ciclos cósmicos, destino, cambio favorable', upright: 'El karma gira a tu favor. Un giro inesperado de los acontecimientos desbloquea situaciones que parecían estancadas.', advice: 'Fluye con el cambio y comprende que cada final es la semilla de un nuevo amanecer.' },
      { num: 'XI', name: 'La Justicia', icon: '⚖️', keywords: 'Verdad, equilibrio kármico, rectitud', upright: 'Todo acto genera una consecuencia exacta en el cosmos. La verdad prevalecerá y recibirás lo que justamente sembraste.', advice: 'Sé impecable en tus acuerdos y analiza los hechos con objetividad y serenidad.' },
      { num: 'XII', name: 'El Colgado', icon: '🧘', keywords: 'Nueva perspectiva, rendición sagrada, pausa', upright: 'Detén la prisa. Al mirar las cosas desde un ángulo inverso, lo que parecía un sacrificio se revela como iluminación.', advice: 'Acepta la pausa presente; no fuerces nada antes de su maduración divina.' },
      { num: 'XIII', name: 'La Muerte', icon: '🦋', keywords: 'Renacimiento, transmutación, metamorfosis', upright: 'No temas al cambio: una etapa caduca para que tu verdadera esencia alce el vuelo. La oruga se transforma en mariposa.', advice: 'Suelta con gratitud lo que ya no tiene vida y abraza tu nuevo renacer.' },
      { num: 'XIV', name: 'La Templanza', icon: '🏺', keywords: 'Alquimia, equilibrio, armonía celestial', upright: 'Un ángel vierte aguas celestiales entre tus copas. Sanación, moderación y reconciliación de opuestos en tu vida.', advice: 'Busca el término medio y deja que el tiempo cure y perfume tus procesos.' },
      { num: 'XV', name: 'El Diablo', icon: '🔥', keywords: 'Lazos invisibles, sombra, poder personal', upright: 'Momento de reconocer qué apegos, ilusiones o miedos te mantenían atado. Al mirar tu sombra a la cara, la liberas.', advice: 'Rompe las cadenas de la culpa y reclama tu libre albedrío incondicional.' },
      { num: 'XVI', name: 'La Torre', icon: '⚡', keywords: 'Liberación súbita, despertar, verdad fulgurante', upright: 'El rayo de la verdad derriba las murallas de la ilusión. Aunque remueve, te salva de una estructura falsa.', advice: 'Agradece la verdad que te libera; sobre escombros limpios se levanta la luz.' },
      { num: 'XVII', name: 'La Estrella', icon: '⭐', keywords: 'Esperanza, bendición cósmica, inspiración', upright: 'El cielo se abre para derramar gracia sobre ti. Tus oraciones han sido escuchadas y tu fe es recompensada.', advice: 'Mantén viva la esperanza y comparte tu luz con generosidad radiante.' },
      { num: 'XVIII', name: 'La Luna', icon: '🌕', keywords: 'Subconsciente, ilusiones, visiones psíquicas', upright: 'Navegando por las aguas sutiles de la psique. No todo es lo que parece; atraviesa la niebla con tu intuición.', advice: 'No tomes decisiones basadas en temores infundados; espera a que aclare el día.' },
      { num: 'XIX', name: 'El Sol', icon: '☀️', keywords: 'Claridad, triunfo, júbilo radiante, vitalidad', upright: 'La carta más afortunada del oráculo. Éxito rotundo, calor en el corazón, salud renovada y dicha compartida.', advice: 'Celebra la vida, brilla sin reservas y contagia tu calidez a quienes te rodean.' },
      { num: 'XX', name: 'El Juicio', icon: '📯', keywords: 'Despertar del alma, perdón, vocación', upright: 'El clarín cósmico te llama a una vida superior. Una resurrección espiritual donde perdonas el pasado y despiertas.', advice: 'Responde al llamado de tu alma sin mirar atrás; has renacido.' },
      { num: 'XXI', name: 'El Mundo', icon: '🌍', keywords: 'Completitud, plenitud, triunfo cósmico', upright: 'Cierre glorioso de un gran ciclo. La corona del cosmos danza a tu favor; integración total y dicha consumada.', advice: 'Agradece el viaje andado y prepárate para danzar en una nueva octava de luz.' }
    ],

    /**
     * Extrae la carta del día personalizada combinando la fecha de nacimiento y el día actual.
     */
    drawDailyCard(birthDateStr) {
      const birth = new Date(birthDateStr + 'T00:00:00');
      const today = new Date();

      // Semilla armónica determinista para el día
      const seed = birth.getDate() + (birth.getMonth() + 1) * 31 + today.getDate() + (today.getMonth() + 1) * 17 + today.getFullYear();
      const cardIndex = Math.abs(seed) % this.majorArcana.length;
      const card = this.majorArcana[cardIndex];

      return {
        ...card,
        isUpright: true // Para lecturas oraculares del día nos enfocamos en el arquetipo constructivo de luz
      };
    }
  };

  /* ==========================================================================
     4. MOTOR DE RECOMENDACIONES MÍSTICAS & MANTRAS (RECS_ENGINE)
     ========================================================================== */
  const RECS_ENGINE = {
    elementsData: {
      'Fuego': {
        crystal: 'Citrino Solar & Cornalina',
        chakra: 'Manipura (Plexo Solar - Poder y Voluntad)',
        color: 'Dorado Ámbar y Rojo Rubí',
        herb: 'Canela, Laurel y Romero Sagrado',
        mantra: 'Om Agnaye Namaha',
        mantraMeaning: 'Honro y despierto el fuego sagrado de la transmutación divina en mi ser.'
      },
      'Tierra': {
        crystal: 'Ojo de Tigre & Jaspe Rojo',
        chakra: 'Muladhara (Raíz - Seguridad y Enraizamiento)',
        color: 'Verde Bosque y Bronce Profundo',
        herb: 'Sándalo, Cedro y Pachulí',
        mantra: 'Om Gam Ganapataye Namaha',
        mantraMeaning: 'Invoco al eliminador de obstáculos y señor del anclaje próspero terrenal.'
      },
      'Aire': {
        crystal: 'Lapislázuli & Amatista Violeta',
        chakra: 'Vishuddha (Garganta) y Ajna (Tercer Ojo)',
        color: 'Azul Celeste e Índigo Místico',
        herb: 'Lavanda, Salvia Blanca y Menta Silvestre',
        mantra: 'Om Saraswatyai Namaha',
        mantraMeaning: 'Me abro al flujo de la elocuencia sagrada, el discernimiento y las artes divinas.'
      },
      'Agua': {
        crystal: 'Piedra de la Luna & Cuarzo Rosa',
        chakra: 'Anahata (Corazón - Compasión Incondicional)',
        color: 'Aguamarina y Blanco Nacarado',
        herb: 'Loto Sagrado, Jazmín y Melisa',
        mantra: 'Om Namah Shivaya',
        mantraMeaning: 'Me rindo ante la conciencia infinita de paz y profunda sanación interior.'
      }
    },

    getRecommendations(element) {
      return this.elementsData[element] || this.elementsData['Fuego'];
    }
  };

  /* ==========================================================================
     5. SERVICIO DE APIS & RESILIENCIA OFFLINE (API_SERVICE)
     ========================================================================== */
  const API_SERVICE = {
    
    /**
     * Base de datos histórica curada y enriquecida para fallback 100% fiable.
     */
    fallbackHistory: {
      events: [
        { year: '1610', text: 'Galileo Galilei perfecciona sus observaciones astronómicas documentando lunas y estrellas lejanas.' },
        { year: '1781', text: 'Se registran avances trascendentales en la cartografía celeste y el descubrimiento de nuevos planetas.' },
        { year: '1888', text: 'Inicios de la teosofía moderna y el rescate de textos sagrados orientales para el pensamiento occidental.' },
        { year: '1969', text: 'Hito histórico en la exploración espacial de la humanidad con misiones de navegación lunar.' },
        { year: '1990', text: 'El telescopio espacial Hubble inicia la transmisión de las imágenes más profundas del cosmos jamás vistas.' }
      ],
      births: [
        { year: '1452', text: 'Leonardo da Vinci, genio universal, filósofo de las proporciones divinas y alquimista del arte.' },
        { year: '1856', text: 'Nikola Tesla, maestro de la resonancia cósmica, la energía y la frecuencia electromagnética.' },
        { year: '1875', text: 'Carl Gustav Jung, pionero de la psicología analítica, los arquetipos y la sincronicidad cósmica.' },
        { year: '1879', text: 'Albert Einstein, revolucionario de la física del espacio-tiempo y la relatividad universal.' },
        { year: '1893', text: 'Paramahansa Yogananda, sabio maestro que trajo el Kriya Yoga y la sabiduría de Oriente al mundo.' }
      ],
      science: [
        { year: '1687', text: 'Publicación de los principios matemáticos de la gravitación universal y armonía de las órbitas celestes.' },
        { year: '1928', text: 'Descubrimiento de la penicilina, transformando para siempre la sanación del cuerpo humano.' },
        { year: '1977', text: 'Lanzamiento de las sondas interestelares Voyager con el disco de oro que contiene los sonidos sagrados de la Tierra.' },
        { year: '2015', text: 'Detección por primera vez en la historia de las ondas gravitacionales predichas por la astrofísica.' }
      ]
    },

    /**
     * Consulta Wikimedia REST API para "On This Day" con timeout y fallback automático.
     */
    async fetchWikipediaOnThisDay(month, day) {
      // Normalizar mes y día a formato 2 dígitos
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const url = `https://es.wikipedia.org/api/rest_v1/feed/onthisday/all/${mm}/${dd}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Wikipedia API respondió con estado: ${response.status}`);
        }

        const data = await response.json();

        // Procesar eventos
        const events = (data.selected || data.events || []).slice(0, 6).map(item => ({
          year: String(item.year || 'Efeméride'),
          text: item.text || (item.pages && item.pages[0] ? item.pages[0].extract : 'Hecho histórico registrado en esta fecha.')
        }));

        // Procesar nacimientos
        const births = (data.births || []).slice(0, 6).map(item => ({
          year: String(item.year || 'Nacimiento'),
          text: item.text || (item.pages && item.pages[0] ? item.pages[0].extract : 'Personaje célebre nacido en este día.')
        }));

        // Si no hay suficientes eventos astronómicos o de ciencia, complementar con los seleccionados
        const science = events.filter(e => 
          /astronom|cienc|descubri|físic|químic|planeta|espacio|luna|estrell/i.test(e.text)
        );

        return {
          events: events.length > 0 ? events : this.fallbackHistory.events,
          births: births.length > 0 ? births : this.fallbackHistory.births,
          science: science.length > 0 ? science : this.fallbackHistory.science,
          source: 'Wikipedia en Español (Tiempo Real)'
        };

      } catch (error) {
        console.warn('Conexión con Wikipedia API no disponible o bloqueada por CORS. Activando Archivo Histórico Astral local:', error.message);
        return {
          ...this.fallbackHistory,
          source: 'Crónicas Históricas Universales (Archivo Astral)'
        };
      }
    },

    /**
     * Consulta o sintetiza el horóscopo del día con tránsitos y aspectos clave.
     */
    async fetchHoroscope(signName, element) {
      // Motor generativo astrológico determinista y contextual para hoy
      const today = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const dateStr = today.toLocaleDateString('es-ES', options);

      const generalTemplates = [
        `La alineación cósmica de hoy favorece tu elemento ${element}. La energía planetaria activa tu casa solar de la intuición y la manifestación, invitándote a confiar en tu primer impulso.`,
        `Bajo los tránsitos astrales de este día, tu signo ${signName} recibe un flujo armónico que despeja dudas del pasado y te permite concentrarte en tus metas más elevadas.`,
        `Hoy el firmamento te otorga una claridad singular. Es un momento propicio para sanar pendientes emocionales y sembrar intenciones claras para las próximas semanas.`
      ];

      const loveAspects = [
        'Vibración de ternura y complicidad. Buen momento para conversaciones sinceras que fortalecen lazos sagrados.',
        'Magnetismo en alza. Si estás en pareja, habrá renovación de pactos; si estás libre, una atracción enigmática puede sorprenderte.',
        'La clave hoy es la escucha profunda. Permite que el otro exprese su sentir sin juzgar.'
      ];

      const workAspects = [
        'Excelente enfoque para organizar proyectos y tomar decisiones que demandaban coraje estratégico.',
        'Tu capacidad de liderazgo e innovación destaca. Llegan noticias o reconocimientos por tu dedicación previa.',
        'La prudencia y la atención a los detalles te evitarán malentendidos. Buen día para firmas y acuerdos.'
      ];

      const healthAspects = [
        'Vitalidad en ascenso. Tu cuerpo te pide movimiento consciente: caminatas al aire libre o meditación.',
        'Momento de purificar energías. Bebe agua abundante y descansa de pantallas para calmar tu mente.',
        'Buen equilibrio psicofísico. Aprovecha para armonizar tus horas de sueño y reconectar con la naturaleza.'
      ];

      // Selección basada en fecha y signo
      const idx = (today.getDate() + signName.length) % 3;

      return {
        dateStr,
        general: generalTemplates[idx],
        love: loveAspects[idx],
        work: workAspects[idx],
        health: healthAspects[(idx + 1) % 3]
      };
    }
  };

  /* ==========================================================================
     6. GENERADOR DE SONIDO SAGRADO (SOUND_ENGINE) - Web Audio API
     ========================================================================== */
  const SOUND_ENGINE = {
    audioCtx: null,
    isPlaying: false,
    oscillators: [],
    gainNode: null,

    init() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
    },

    /**
     * Sintetiza un cuenco tibetano / campana de meditación armónica pura (432 Hz y parciales).
     */
    toggleSound(buttonEl, iconEl, textEl) {
      this.init();

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      if (this.isPlaying) {
        this.stopSound();
        buttonEl.classList.remove('playing');
        iconEl.textContent = '🔔';
        textEl.textContent = 'Sintonizar 432 Hz';
        UI_CONTROLLER.showToast('Vibración sagrada silenciada.');
      } else {
        this.playSound(432); // Frecuencia Solfeggio de armonía natural
        buttonEl.classList.add('playing');
        iconEl.textContent = '🎶';
        textEl.textContent = 'Detener Frecuencia';
        UI_CONTROLLER.showToast('Resonando en 432 Hz: Frecuencia de Armonía Universal.');
      }
    },

    playSound(fundamentalFreq) {
      this.stopSound();
      this.isPlaying = true;

      const now = this.audioCtx.currentTime;

      // Ganancia Maestra
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.18, now + 1.5);
      this.gainNode.connect(this.audioCtx.destination);

      // Armónicos de Cuenco Tibetano (Fundamental + parciales no armónicos característicos de metal)
      const harmonics = [
        { freq: fundamentalFreq, gain: 0.5 },
        { freq: fundamentalFreq * 2.01, gain: 0.25 },
        { freq: fundamentalFreq * 3.02, gain: 0.12 },
        { freq: fundamentalFreq * 0.5, gain: 0.15 } // Subarmónico terrenal
      ];

      this.oscillators = harmonics.map(h => {
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.freq, now);

        // Modulación sutil de vibrato (LFO)
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();
        lfo.frequency.value = 0.25; // 0.25 Hz latido meditativo
        lfoGain.gain.value = 1.2;
        lfo.connect(osc.frequency);
        lfo.start();

        oscGain.gain.value = h.gain;
        osc.connect(oscGain);
        oscGain.connect(this.gainNode);

        osc.start(now);
        return osc;
      });
    },

    stopSound() {
      if (this.gainNode && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        setTimeout(() => {
          this.oscillators.forEach(osc => {
            try { osc.stop(); } catch (e) {}
          });
          this.oscillators = [];
        }, 1300);
      }
      this.isPlaying = false;
    }
  };

  /* ==========================================================================
     7. CANVAS DE POLVO CÓSMICO & ESTRELLAS (COSMIC_CANVAS)
     ========================================================================== */
  const COSMIC_CANVAS = {
    canvas: null,
    ctx: null,
    particles: [],
    numParticles: 80,
    animationFrameId: null,

    init() {
      this.canvas = document.getElementById('cosmic-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      this.createParticles();
      this.animate();

      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    createParticles() {
      this.particles = [];
      for (let i = 0; i < this.numParticles; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.7 + 0.2,
          speedY: (Math.random() - 0.5) * 0.25,
          speedX: (Math.random() - 0.5) * 0.25,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          color: Math.random() > 0.3 ? '#fae19c' : '#c084fc'
        });
      }
    },

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (const p of this.particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha += Math.sin(Date.now() * p.twinkleSpeed) * 0.01;

        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;

        const currentAlpha = Math.max(0.1, Math.min(0.9, p.alpha));

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = currentAlpha;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.fill();
      }

      this.ctx.globalAlpha = 1;
      this.ctx.shadowBlur = 0;
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  };

  /* ==========================================================================
     8. CONTROLADOR DE INTERFAZ & RENDERIZADO (UI_CONTROLLER)
     ========================================================================== */
  const UI_CONTROLLER = {
    currentData: null,

    init() {
      this.cacheElements();
      this.bindEvents();
      this.setupDateLimit();
      COSMIC_CANVAS.init();
    },

    cacheElements() {
      this.form = document.getElementById('oracle-form');
      this.dateInput = document.getElementById('birth-date');
      this.btnReveal = document.getElementById('btn-reveal');
      this.formError = document.getElementById('form-error');
      this.loader = document.getElementById('mystic-loader');
      this.resultsSection = document.getElementById('oracle-results');

      // Top Toolbar
      this.btnSound = document.getElementById('btn-sound-toggle');
      this.soundIcon = document.getElementById('sound-icon');
      this.soundText = this.btnSound.querySelector('.sound-text');
      this.btnPrint = document.getElementById('btn-print-papiro');

      // Header Results
      this.resBirthFormatted = document.getElementById('res-birth-formatted');
      this.statZodiacName = document.getElementById('stat-zodiac-name');
      this.statNumerologyNum = document.getElementById('stat-numerology-num');
      this.statMoonPhase = document.getElementById('stat-moon-phase');

      // Cronometría
      this.ageYears = document.getElementById('age-years');
      this.ageMonths = document.getElementById('age-months');
      this.ageDays = document.getElementById('age-days');
      this.ageTotalDays = document.getElementById('age-total-days');
      this.ageMoonsSeen = document.getElementById('age-moons-seen');
      this.ageNextBday = document.getElementById('age-next-bday');

      // Zodiaco
      this.zodiacGlyph = document.getElementById('zodiac-glyph');
      this.zodiacName = document.getElementById('zodiac-name');
      this.zodiacElement = document.getElementById('zodiac-element');
      this.zodiacModality = document.getElementById('zodiac-modality');
      this.zodiacRuler = document.getElementById('zodiac-ruler');
      this.zodiacDesc = document.getElementById('zodiac-desc');
      this.vedicRashiName = document.getElementById('vedic-rashi-name');
      this.vedicInsight = document.getElementById('vedic-insight');

      // Luna
      this.moonGlyph = document.getElementById('moon-glyph');
      this.moonPhaseArt = document.getElementById('moon-phase-art');
      this.moonPhaseName = document.getElementById('moon-phase-name');
      this.moonIllumination = document.getElementById('moon-illumination');
      this.moonArchetypeTitle = document.getElementById('moon-archetype-title');
      this.moonArchetypeDesc = document.getElementById('moon-archetype-desc');

      // Numerología
      this.numLifePath = document.getElementById('num-life-path');
      this.numArchetypeName = document.getElementById('num-archetype-name');
      this.numMeaning = document.getElementById('num-meaning');
      this.numGift = document.getElementById('num-gift');
      this.numKarma = document.getElementById('num-karma');

      // Tarot
      this.tarotWrap = document.getElementById('tarot-flip-wrap');
      this.tarotRoman = document.getElementById('tarot-roman');
      this.tarotArtwork = document.getElementById('tarot-artwork');
      this.tarotName = document.getElementById('tarot-name');
      this.tarotOrientation = document.getElementById('tarot-orientation');
      this.tarotKeywords = document.getElementById('tarot-keywords');
      this.tarotReading = document.getElementById('tarot-reading');
      this.tarotAdviceText = document.getElementById('tarot-advice-text');

      // Horóscopo
      this.horoscopeDateBadge = document.getElementById('horoscope-date-badge');
      this.horoscopeSourceBadge = document.getElementById('horoscope-source-badge');
      this.horoscopeOverview = document.getElementById('horoscope-overview');
      this.horoscopeLove = document.getElementById('horoscope-love');
      this.horoscopeWork = document.getElementById('horoscope-work');
      this.horoscopeHealth = document.getElementById('horoscope-health');

      // Biorritmos
      this.bioPhysicalPct = document.getElementById('bio-physical-pct');
      this.bioPhysicalBar = document.getElementById('bio-physical-bar');
      this.bioEmotionalPct = document.getElementById('bio-emotional-pct');
      this.bioEmotionalBar = document.getElementById('bio-emotional-bar');
      this.bioIntellectualPct = document.getElementById('bio-intellectual-pct');
      this.bioIntellectualBar = document.getElementById('bio-intellectual-bar');
      this.bioSpiritualPct = document.getElementById('bio-spiritual-pct');
      this.bioSpiritualBar = document.getElementById('bio-spiritual-bar');

      // Recomendaciones
      this.recCrystal = document.getElementById('rec-crystal');
      this.recChakra = document.getElementById('rec-chakra');
      this.recColor = document.getElementById('rec-color');
      this.recHerb = document.getElementById('rec-herb');
      this.recMantra = document.getElementById('rec-mantra');
      this.recMantraMeaning = document.getElementById('rec-mantra-meaning');

      // Historia / Wikipedia
      this.historyListEvents = document.getElementById('history-list-events');
      this.historyListBirths = document.getElementById('history-list-births');
      this.historyListScience = document.getElementById('history-list-science');
      this.historyHeaderTitle = document.getElementById('history-header-title');

      // Botones de acción inferiores
      this.btnDownloadPdf = document.getElementById('btn-download-pdf');
      this.btnDownloadImg = document.getElementById('btn-download-img');
      this.btnPreviewPapiro = document.getElementById('btn-preview-papiro');
      this.btnShare = document.getElementById('btn-share-oracle');
      this.btnNewConsult = document.getElementById('btn-new-consult');

      // Modal de Papiro Astral
      this.papiroModal = document.getElementById('papiro-modal');
      this.modalBackdrop = document.getElementById('modal-backdrop');
      this.modalBtnClose = document.getElementById('modal-btn-close');
      this.modalBtnPdf = document.getElementById('modal-btn-pdf');
      this.modalBtnImg = document.getElementById('modal-btn-img');
      this.papiroContainer = document.getElementById('papiro-parchment');

      // Toast
      this.toast = document.getElementById('sacred-toast');
      this.toastMsg = document.getElementById('toast-message');
    },

    setupDateLimit() {
      // Máxima fecha: hoy
      const today = new Date().toISOString().split('T')[0];
      this.dateInput.setAttribute('max', today);
    },

    bindEvents() {
      // Envío del formulario
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });

      // Pestañas de Wikipedia
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tabBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');

          const tabName = btn.getAttribute('data-tab');
          this.switchHistoryTab(tabName);
        });
      });

      // Flip de la carta del Tarot
      this.tarotWrap.addEventListener('click', () => {
        this.tarotWrap.classList.toggle('flipped');
      });
      this.tarotWrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.tarotWrap.classList.toggle('flipped');
        }
      });

      // Toggle de Sonido Sagrado
      this.btnSound.addEventListener('click', () => {
        SOUND_ENGINE.toggleSound(this.btnSound, this.soundIcon, this.soundText);
      });

      // Ver Papiro Astral (toolbar superior)
      this.btnPrint.addEventListener('click', () => {
        this.openPapiroModal();
      });

      // Descargar PDF desde botón principal
      if (this.btnDownloadPdf) {
        this.btnDownloadPdf.addEventListener('click', () => {
          this.exportPapiro('pdf');
        });
      }

      // Guardar Imagen desde botón principal
      if (this.btnDownloadImg) {
        this.btnDownloadImg.addEventListener('click', () => {
          this.exportPapiro('img');
        });
      }

      // Ver Papiro Astral en pantalla
      if (this.btnPreviewPapiro) {
        this.btnPreviewPapiro.addEventListener('click', () => {
          this.openPapiroModal();
        });
      }

      // Acciones del Modal
      if (this.modalBtnClose) {
        this.modalBtnClose.addEventListener('click', () => this.closePapiroModal());
      }
      if (this.modalBackdrop) {
        this.modalBackdrop.addEventListener('click', () => this.closePapiroModal());
      }
      if (this.modalBtnPdf) {
        this.modalBtnPdf.addEventListener('click', () => this.exportPapiro('pdf'));
      }
      if (this.modalBtnImg) {
        this.modalBtnImg.addEventListener('click', () => this.exportPapiro('img'));
      }

      // Tecla ESC para cerrar modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.papiroModal && !this.papiroModal.classList.contains('hidden')) {
          this.closePapiroModal();
        }
      });

      // Copiar Resumen Astral
      this.btnShare.addEventListener('click', () => {
        this.copyAstralSummary();
      });

      // Nueva Consulta
      this.btnNewConsult.addEventListener('click', () => {
        this.resultsSection.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.dateInput.focus();
      });
    },

    showError(msg) {
      this.formError.textContent = msg;
      this.formError.classList.remove('hidden');
    },

    hideError() {
      this.formError.classList.add('hidden');
    },

    showToast(message) {
      this.toastMsg.textContent = message;
      this.toast.classList.remove('hidden');
      setTimeout(() => {
        this.toast.classList.add('hidden');
      }, 3500);
    },

    async handleFormSubmit() {
      this.hideError();
      const rawDate = this.dateInput.value;

      if (!rawDate) {
        this.showError('Por favor selecciona tu fecha sagrada de nacimiento.');
        return;
      }

      const birthDate = new Date(rawDate + 'T00:00:00');
      const now = new Date();

      if (isNaN(birthDate.getTime())) {
        this.showError('La fecha ingresada no es válida.');
        return;
      }

      if (birthDate > now) {
        this.showError('La fecha no puede ser en el futuro cósmico. Ingresa una fecha terrenal pasada.');
        return;
      }

      // Mostrar Loader Místico
      this.loader.classList.remove('hidden');
      this.resultsSection.classList.add('hidden');
      this.btnReveal.disabled = true;

      try {
        const [year, month, day] = rawDate.split('-').map(n => parseInt(n, 10));

        // 1. Cálculos síncronos puros
        const ageData = ASTRO_ENGINE.calculateAge(rawDate);
        const zodiac = ASTRO_ENGINE.getZodiacData(month, day);
        const moonPhase = ASTRO_ENGINE.getMoonPhase(year, month, day);
        const lifePath = NUMEROLOGY_ENGINE.calculateLifePath(rawDate);
        const biorhythms = ASTRO_ENGINE.calculateBiorhythms(rawDate);
        const tarotCard = TAROT_ENGINE.drawDailyCard(rawDate);
        const recs = RECS_ENGINE.getRecommendations(zodiac.element);

        // 2. Consultas asíncronas con fallbacks
        const [historyData, horoscopeData] = await Promise.all([
          API_SERVICE.fetchWikipediaOnThisDay(month, day),
          API_SERVICE.fetchHoroscope(zodiac.name, zodiac.element)
        ]);

        this.currentData = {
          rawDate,
          birthDate,
          ageData,
          zodiac,
          moonPhase,
          lifePath,
          biorhythms,
          tarotCard,
          recs,
          historyData,
          horoscopeData
        };

        // Renderizar datos en el DOM
        this.renderAllResults(this.currentData);

        // Pequeño retardo ceremonial para sentir la alineación cósmica
        setTimeout(() => {
          this.loader.classList.add('hidden');
          this.resultsSection.classList.remove('hidden');
          this.btnPrint.classList.remove('hidden');
          this.btnReveal.disabled = false;

          // Desplazamiento suave al santuario de resultados
          this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Auto-revelar la carta del Tarot tras 1.2s para efecto sorpresa
          setTimeout(() => {
            this.tarotWrap.classList.add('flipped');
          }, 1200);
        }, 700);

      } catch (err) {
        console.error('Error al procesar el oráculo:', err);
        this.loader.classList.add('hidden');
        this.btnReveal.disabled = false;
        this.showError('Hubo una turbulencia al canalizar las constelaciones. Intenta nuevamente.');
      }
    },

    renderAllResults(data) {
      // Fecha en español
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = data.birthDate.toLocaleDateString('es-ES', options);
      this.resBirthFormatted.textContent = formattedDate;

      // Resumen superior
      this.statZodiacName.textContent = data.zodiac.name;
      this.statNumerologyNum.textContent = `N° ${data.lifePath.number}`;
      this.statMoonPhase.textContent = data.moonPhase.name.split('(')[0].trim();

      // 1. Cronometría
      this.ageYears.textContent = data.ageData.years;
      this.ageMonths.textContent = data.ageData.months;
      this.ageDays.textContent = data.ageData.days;
      this.ageTotalDays.textContent = data.ageData.totalDays.toLocaleString('es-ES') + ' días';
      this.ageMoonsSeen.textContent = data.ageData.moonsSeen.toLocaleString('es-ES') + ' plenilunios';
      this.ageNextBday.textContent = `en ${data.ageData.daysToNextBday} días`;

      // 2. Zodiaco
      this.zodiacGlyph.textContent = data.zodiac.glyph;
      this.zodiacName.textContent = `${data.zodiac.name} (${data.zodiac.glyph})`;
      this.zodiacElement.textContent = `Elemento: ${data.zodiac.element}`;
      this.zodiacModality.textContent = `Cualidad: ${data.zodiac.modality}`;
      this.zodiacRuler.textContent = `Regente: ${data.zodiac.ruler}`;
      this.zodiacDesc.textContent = `Nacido bajo el influjo de ${data.zodiac.name}, tu arquetipo solar está gobernado por ${data.zodiac.ruler}. Perteneces a la fuerza del elemento ${data.zodiac.element}, expresando un temperamento ${data.zodiac.modality.toLowerCase()} que moldea tu carácter y tu camino en este plano.`;
      this.vedicRashiName.textContent = data.zodiac.rashi;
      this.vedicInsight.textContent = `${data.zodiac.vedicDesc} Regente védico: ${data.zodiac.vedicLord}.`;

      // 3. Luna
      this.moonGlyph.textContent = data.moonPhase.glyph;
      this.moonPhaseName.textContent = data.moonPhase.name;
      this.moonIllumination.textContent = `Iluminación lunar: ${data.moonPhase.illumination}% del disco visible`;
      this.moonArchetypeTitle.textContent = data.moonPhase.archetype;
      this.moonArchetypeDesc.textContent = data.moonPhase.desc;

      // Render gráfico de la luna con sombra/luz en SVG
      this.moonPhaseArt.innerHTML = `
        <svg viewBox="0 0 60 60" width="100%" height="100%">
          <defs>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff8e7"/>
              <stop offset="70%" stop-color="#f5d77f"/>
              <stop offset="100%" stop-color="#d4af37"/>
            </radialGradient>
          </defs>
          <circle cx="30" cy="30" r="26" fill="#120c24" stroke="#d4af37" stroke-width="1.5"/>
          <circle cx="30" cy="30" r="26" fill="url(#moonGlow)" opacity="${Math.max(0.15, data.moonPhase.illumination / 100)}"/>
        </svg>
      `;

      // 4. Numerología
      this.numLifePath.textContent = data.lifePath.number;
      this.numArchetypeName.textContent = data.lifePath.title;
      this.numMeaning.textContent = data.lifePath.desc;
      this.numGift.textContent = data.lifePath.gift;
      this.numKarma.textContent = data.lifePath.karma;

      // 5. Tarot
      this.tarotWrap.classList.remove('flipped');
      this.tarotRoman.textContent = data.tarotCard.num;
      this.tarotArtwork.textContent = data.tarotCard.icon;
      this.tarotName.textContent = data.tarotCard.name;
      this.tarotOrientation.textContent = 'Al Derecho (Luz Directa)';
      this.tarotKeywords.textContent = data.tarotCard.keywords;
      this.tarotReading.textContent = data.tarotCard.upright;
      this.tarotAdviceText.textContent = data.tarotCard.advice;

      // 6. Horóscopo
      this.horoscopeDateBadge.textContent = data.horoscopeData.dateStr;
      this.horoscopeOverview.textContent = data.horoscopeData.general;
      this.horoscopeLove.textContent = data.horoscopeData.love;
      this.horoscopeWork.textContent = data.horoscopeData.work;
      this.horoscopeHealth.textContent = data.horoscopeData.health;

      // 7. Biorritmos
      this.bioPhysicalPct.textContent = `${data.biorhythms.physical}%`;
      this.bioPhysicalBar.style.width = `${data.biorhythms.physical}%`;

      this.bioEmotionalPct.textContent = `${data.biorhythms.emotional}%`;
      this.bioEmotionalBar.style.width = `${data.biorhythms.emotional}%`;

      this.bioIntellectualPct.textContent = `${data.biorhythms.intellectual}%`;
      this.bioIntellectualBar.style.width = `${data.biorhythms.intellectual}%`;

      this.bioSpiritualPct.textContent = `${data.biorhythms.spiritual}%`;
      this.bioSpiritualBar.style.width = `${data.biorhythms.spiritual}%`;

      // 8. Recomendaciones
      this.recCrystal.textContent = data.recs.crystal;
      this.recChakra.textContent = data.recs.chakra;
      this.recColor.textContent = data.recs.color;
      this.recHerb.textContent = data.recs.herb;
      this.recMantra.textContent = data.recs.mantra;
      this.recMantraMeaning.textContent = data.recs.mantraMeaning;

      // 9. Historia (Wikipedia)
      this.historyHeaderTitle.textContent = `Acontecimientos en el Cosmos un ${data.birthDate.getDate()} de ${data.birthDate.toLocaleDateString('es-ES', { month: 'long' })}`;
      this.renderHistoryList(this.historyListEvents, data.historyData.events);
      this.renderHistoryList(this.historyListBirths, data.historyData.births);
      this.renderHistoryList(this.historyListScience, data.historyData.science);
    },

    renderHistoryList(containerEl, items) {
      if (!items || items.length === 0) {
        containerEl.innerHTML = '<li class="history-empty">No se hallaron registros específicos para esta vibración temporal.</li>';
        return;
      }

      containerEl.innerHTML = items.map(item => `
        <li class="history-item">
          <span class="history-year">Año ${item.year}</span>
          <p class="history-text">${item.text}</p>
        </li>
      `).join('');
    },

    switchHistoryTab(tabName) {
      this.historyListEvents.classList.toggle('hidden', tabName !== 'events');
      this.historyListBirths.classList.toggle('hidden', tabName !== 'births');
      this.historyListScience.classList.toggle('hidden', tabName !== 'science');
    },

    copyAstralSummary() {
      if (!this.currentData) return;

      const d = this.currentData;
      const text = `
✨ ORÁCULO VÉDICO & CUMPLEAÑOS ESOTÉRICO ✨
-----------------------------------------------
📅 Fecha Sagrada: ${d.birthDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
⏳ Edad Exacta: ${d.ageData.years} años, ${d.ageData.months} meses y ${d.ageData.days} días
☀️ Signo Solar: ${d.zodiac.name} (${d.zodiac.glyph}) - Elemento ${d.zodiac.element}
🕉️ Rashi Védico: ${d.zodiac.rashi}
🌙 Fase Lunar Natal: ${d.moonPhase.name} (${d.moonPhase.archetype})
🔢 Ruta de Vida: ${d.lifePath.number} (${d.lifePath.title})
🎴 Carta del Tarot: ${d.tarotCard.num} - ${d.tarotCard.name}
💎 Cristal Protector: ${d.recs.crystal}
🧘 Mantra Personal: "${d.recs.mantra}" (${d.recs.mantraMeaning})
-----------------------------------------------
Canalizado en el Santuario de Sabiduría Ancestral.
      `.trim();

      navigator.clipboard.writeText(text).then(() => {
        this.showToast('¡Resumen Astral copiado al portapapeles con éxito!');
      }).catch(() => {
        this.showToast('Selecciona el texto para copiarlo manualmente.');
      });
    },

    openPapiroModal() {
      if (!this.currentData) {
        this.showToast('Primero revela tu destino cósmico.');
        return;
      }
      PDF_ENGINE.populateParchment(this.papiroContainer, this.currentData);
      this.papiroModal.classList.remove('hidden');
    },

    closePapiroModal() {
      if (this.papiroModal) {
        this.papiroModal.classList.add('hidden');
      }
    },

    async exportPapiro(format) {
      if (!this.currentData) {
        this.showToast('Primero revela tu destino cósmico.');
        return;
      }

      if (format === 'pdf') {
        await PDF_ENGINE.exportPDF(
          this.papiroContainer,
          this.papiroModal,
          this.currentData,
          this.btnDownloadPdf,
          (msg) => this.showToast(msg)
        );
      } else if (format === 'img') {
        await PDF_ENGINE.exportImage(
          this.papiroContainer,
          this.papiroModal,
          this.currentData,
          this.btnDownloadImg,
          (msg) => this.showToast(msg)
        );
      }
    }
  };

  /* ==========================================================================
     9. MOTOR DE GENERACIÓN DE PDF E IMAGEN CEREMONIAL (PDF_ENGINE)
     ========================================================================== */
  const PDF_ENGINE = {
    /**
     * Construye e inyecta el HTML del Papiro Astral en el contenedor.
     */
    populateParchment(containerEl, data) {
      if (!containerEl || !data) return;

      const birthFormatted = data.birthDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const nowFormatted = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      containerEl.innerHTML = `
        <div class="papiro-corner papiro-corner-tl">✦</div>
        <div class="papiro-corner papiro-corner-tr">✦</div>
        <div class="papiro-corner papiro-corner-bl">✦</div>
        <div class="papiro-corner papiro-corner-br">✦</div>

        <!-- Encabezado Sagrado -->
        <div class="papiro-header">
          <div class="papiro-om-seal">ॐ</div>
          <div class="papiro-subtag">ORÁCULO VÉDICO · SANTUARIO CELESTIAL</div>
          <h1 class="papiro-main-title">PAPIRO ASTRAL & MAPA DEL ALMA</h1>
          <div class="papiro-date-badge">
            📅 Fecha Sagrada de Nacimiento: <strong>${birthFormatted}</strong>
          </div>
        </div>

        <!-- Grilla de Módulos Astrales (2 columnas) -->
        <div class="papiro-grid">
          
          <!-- 1. Cronometría Terrenal -->
          <div class="papiro-card">
            <div class="papiro-card-title">⏳ Cronometría de tu Alma</div>
            <div class="papiro-card-body">
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Edad Exacta:</span>
                <span class="papiro-highlight-val">${data.ageData.years} años, ${data.ageData.months} m, ${data.ageData.days} d</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Días de viaje cósmico:</span>
                <span class="papiro-stat-val">${data.ageData.totalDays.toLocaleString('es-ES')} días</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Lunas llenas vividas:</span>
                <span class="papiro-stat-val">${data.ageData.moonsSeen.toLocaleString('es-ES')} plenilunios</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Próximo retorno solar:</span>
                <span class="papiro-stat-val">en ${data.ageData.daysToNextBday} días</span>
              </div>
            </div>
          </div>

          <!-- 2. Identidad Zodiacal & Védica -->
          <div class="papiro-card">
            <div class="papiro-card-title">${data.zodiac.glyph} Arquetipo Solar & Rashi</div>
            <div class="papiro-card-body">
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Signo Occidental:</span>
                <span class="papiro-highlight-val">${data.zodiac.name} (${data.zodiac.glyph})</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Elemento / Regente:</span>
                <span class="papiro-stat-val">${data.zodiac.element} · ${data.zodiac.ruler}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Correspondencia Védica:</span>
                <span class="papiro-stat-val">${data.zodiac.rashi}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Señor Cósmico (Jyotish):</span>
                <span class="papiro-stat-val">${data.zodiac.vedicLord}</span>
              </div>
            </div>
          </div>

          <!-- 3. Fase Lunar Natal -->
          <div class="papiro-card">
            <div class="papiro-card-title">${data.moonPhase.glyph} Fase Lunar Natal</div>
            <div class="papiro-card-body">
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Fase Astronómica:</span>
                <span class="papiro-highlight-val">${data.moonPhase.name.split('(')[0].trim()}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Arquetipo del Alma:</span>
                <span class="papiro-stat-val">${data.moonPhase.archetype}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Iluminación del disco:</span>
                <span class="papiro-stat-val">${data.moonPhase.illumination}% visible</span>
              </div>
              <p style="margin-top: 4px; font-size: 0.72rem; color: #c5bcdb; font-style: italic; line-height: 1.35;">
                "${data.moonPhase.desc.substring(0, 110)}..."
              </p>
            </div>
          </div>

          <!-- 4. Código Pitagórico de Vida -->
          <div class="papiro-card">
            <div class="papiro-card-title">🔢 Código de Vida Pitagórico</div>
            <div class="papiro-card-body">
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Ruta de Vida:</span>
                <span class="papiro-highlight-val">Número ${data.lifePath.number}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Título Arquetípico:</span>
                <span class="papiro-stat-val">${data.lifePath.title}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Don Primordial:</span>
                <span class="papiro-stat-val">${data.lifePath.gift.substring(0, 44)}...</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Desafío Kármico:</span>
                <span class="papiro-stat-val">${data.lifePath.karma.substring(0, 44)}...</span>
              </div>
            </div>
          </div>

          <!-- 5. Carta del Tarot del Día -->
          <div class="papiro-card">
            <div class="papiro-card-title">🎴 Carta del Tarot Asignada</div>
            <div class="papiro-card-body">
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Arcano Mayor:</span>
                <span class="papiro-highlight-val">${data.tarotCard.num} - ${data.tarotCard.name} ${data.tarotCard.icon}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Orientación:</span>
                <span class="papiro-stat-val">Al Derecho (Luz Directa)</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Palabras Clave:</span>
                <span class="papiro-stat-val">${data.tarotCard.keywords}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Consejo Sagrado:</span>
                <span class="papiro-stat-val">${data.tarotCard.advice.substring(0, 60)}...</span>
              </div>
            </div>
          </div>

          <!-- 6. Prescripción de Armonización -->
          <div class="papiro-card">
            <div class="papiro-card-title">💎 Prescripción de Armonización</div>
            <div class="papiro-card-body">
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Cristal Protector:</span>
                <span class="papiro-highlight-val">${data.recs.crystal}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Chakra Central:</span>
                <span class="papiro-stat-val">${data.recs.chakra.split('(')[0].trim()}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Color de Aura:</span>
                <span class="papiro-stat-val">${data.recs.color}</span>
              </div>
              <div class="papiro-stat-row">
                <span class="papiro-stat-label">Hierba Sagrada:</span>
                <span class="papiro-stat-val">${data.recs.herb}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Mantra Sagrado (Ancho Completo) -->
        <div class="papiro-card-full">
          <div class="papiro-mantra-title">🕉️ MANTRA PERSONAL DE ELEVACIÓN VIBRACIONAL</div>
          <div class="papiro-mantra-text">"${data.recs.mantra}"</div>
          <div class="papiro-mantra-desc">${data.recs.mantraMeaning}</div>
        </div>

        <!-- Pie Ceremonial -->
        <div class="papiro-footer">
          <div class="papiro-seal-badge">
            <div class="papiro-seal-icon">☸</div>
            <div class="papiro-seal-text">
              <strong>SELLADO EN EL TEMPLO DEL ORÁCULO</strong>
              <span>Confeccionado bajo alineaciones armónicas · Emitido el ${nowFormatted}</span>
            </div>
          </div>
          <div class="papiro-footer-rights">
            SABIDURÍA VÉDICA & CARTOGRAFÍA ASTRAL
          </div>
        </div>
      `;
    },

    /**
     * Captura el papiro usando html2canvas en alta definición.
     */
    async captureCanvas(containerEl, modalEl) {
      const wasHidden = modalEl.classList.contains('hidden');
      if (wasHidden) {
        modalEl.classList.remove('hidden');
      }

      // Tiempo prudencial para el pintado del layout
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const canvas = await html2canvas(containerEl, {
          scale: 2, // 2x alta resolución (retina/impresión)
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#0d0724',
          logging: false
        });
        return canvas;
      } catch (err) {
        console.error('Error al capturar papiro:', err);
        throw err;
      }
    },

    /**
     * Exporta a PDF de 1 página A4 impecable.
     */
    async exportPDF(containerEl, modalEl, data, btnElement, onToast) {
      if (!data) return;

      const targetBtn = btnElement || document.getElementById('btn-download-pdf');
      const originalHtml = targetBtn ? targetBtn.innerHTML : '';
      if (targetBtn) {
        targetBtn.disabled = true;
        targetBtn.innerHTML = `
          <span class="btn-icon">⏳</span>
          <span>FORJANDO PDF (A4)...</span>
        `;
      }
      onToast('Canalizando y forjando tu Papiro Astral en PDF de alta resolución...');

      this.populateParchment(containerEl, data);

      try {
        const canvas = await this.captureCanvas(containerEl, modalEl);
        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        // Usar jsPDF para garantizar 1 sola página exacta sin desbordamientos
        if (window.jspdf && window.jspdf.jsPDF) {
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          // Proporción A4 exacta: 210mm x 297mm
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
          pdf.save(`Papiro-Astral-${data.rawDate}.pdf`);
          onToast('¡Tu Papiro Astral (PDF) se ha descargado con éxito!');
        } else if (typeof html2pdf !== 'undefined') {
          await html2pdf().set({
            margin: 0,
            filename: `Papiro-Astral-${data.rawDate}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0d0724' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          }).from(containerEl).save();
          onToast('¡Tu Papiro Astral (PDF) se ha descargado con éxito!');
        } else {
          window.print();
        }
      } catch (err) {
        console.error('Fallo en exportPDF, abriendo diálogo de impresión:', err);
        window.print();
        onToast('Abriendo ventana de impresión para guardar como PDF.');
      } finally {
        if (targetBtn) {
          targetBtn.disabled = false;
          targetBtn.innerHTML = originalHtml;
        }
      }
    },

    /**
     * Exporta a Imagen PNG nítida de alta resolución.
     */
    async exportImage(containerEl, modalEl, data, btnElement, onToast) {
      if (!data) return;

      const targetBtn = btnElement || document.getElementById('btn-download-img');
      const originalHtml = targetBtn ? targetBtn.innerHTML : '';
      if (targetBtn) {
        targetBtn.disabled = true;
        targetBtn.innerHTML = `
          <span class="btn-icon">⏳</span>
          <span>GENERANDO PNG...</span>
        `;
      }
      onToast('Generando imagen de alta resolución (PNG)...');

      this.populateParchment(containerEl, data);

      try {
        const canvas = await this.captureCanvas(containerEl, modalEl);
        const imgData = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = `Papiro-Astral-${data.rawDate}.png`;
        link.href = imgData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onToast('¡Imagen del Papiro Astral descargada con éxito!');
      } catch (err) {
        console.error('Fallo en exportImage:', err);
        onToast('Hubo un inconveniente al generar la imagen.');
      } finally {
        if (targetBtn) {
          targetBtn.disabled = false;
          targetBtn.innerHTML = originalHtml;
        }
      }
    }
  };

  // Inicialización al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    UI_CONTROLLER.init();
  });

})();
