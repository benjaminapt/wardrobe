# Wardrobe, handoff de ejecución para Antigravity

## Mandato

Benjamín quiere que avances de forma autónoma y sustantiva, y luego volverá con Codex a auditar y cerrar. Continúa la importación desde su galería, mejora el lookbook y deja cada lote publicado. Prioriza calidad y evidencia por sobre cantidad.

No generes todas las combinaciones matemáticamente posibles. Añade sólo prendas y outfits que se sostengan visualmente y que realmente puedan quedar bien.

## Estado verificable al comenzar

- Rama publicada: main, último merge actual 7f2e3ab.
- Catálogo local: 83 prendas aceptadas.
- Lookbook: 41 outfits activos, todos con imagen modelada.
- Último preview protegido: https://wardrobe-private-9grtfaipj-benjaminaptc-4943s-projects.vercel.app.
- Proyecto Vercel: benjaminaptc-4943s-projects/wardrobe-private.
- Las fotos originales y los assets de catálogo son privados. data/, public/wardrobe/ y .vercel/ están ignorados por Git a propósito.
- No borres ni stages los untracked preexistentes: .Rhistory, .superpowers/, los scripts .py/.mjs listados por git status, prompts.json ni public/wardrobe 3/.

Lee CLAUDE.md antes de trabajar. Ahí están las olas anteriores, las prendas importadas y las decisiones de evidencia.

## Galería: fuente, alcance y límites

- La persona Benjamín en Fotos muestra **2.952 fotos y 34 videos** en la interfaz. No digas que toda la colección son 39 fotos, ese fue sólo un primer lote.
- La biblioteca local es /Users/benjaminapt/Pictures/Photos Library.photoslibrary.
- Trabaja en modo lectura: SQLite con sqlite3 -readonly, fuentes desde resources/derivatives/masters/<primer-caracter-UUID>/<UUID>_4_5005_c.jpeg.
- El identificador usado para la persona es ZPERSONFORFACE=71. No uses un conteo interno de caras de la base como si fuera el conteo de fotos del álbum.
- **No controles Photos.app ni modifiques fotos originales.** En sesiones previas ese control chocó con cambios del usuario.
- Registra por ola el rango temporal revisado, número de derivados examinados, aceptados y retenidos. Mantén los UUID de cada fuente en el manifest.

## Criterio de catálogo

Acepta sólo una prenda física distinguible, vigente y recuperable desde la evidencia. Mantén en hold una pieza si hay duda material sobre:

- si es duplicada de algo ya importado;
- silueta, ruedo, bolsillos, cierres, construcción o capas ocultas;
- texto, sponsor, logo o gráfico que no se puede leer;
- si la foto muestra una compra ajena, una prenda prestada o algo no propio.

Prefiere omitir un detalle antes que inventarlo. Para logos y marcas, conserva sólo los que sean inequívocos en la fuente. No inventes texto, botones, cierres, bolsillos, costuras ni patrocinadores.

Las candidatas retenidas conocidas incluyen piezas con sponsor/texto ilegible, chaquetas con construcción no visible, un cargo beige no establecido como propio, un tank Flamengo sin ruedo suficiente y una polera NUS con texto ambiguo. Revalídalas sólo si encuentras nuevas fotos que resuelvan la evidencia.

## Flujo de importación obligatorio

1. Lee y sigue .agents/skills/import-clothes/SKILL.md y el skill de Imagegen antes de generar.
2. Usa data/model-reference.png como referencia de identidad, sin subirla a Git.
3. Trabaja los intermedios fuera del repo, por ejemplo mktemp -d /tmp/wardrobe-import.XXXXXX. Nunca dejes crops, prompts, manifiestos ni QA temporal dentro de data/.
4. Para cada prenda aceptada, genera un PNG de recorte RGBA fiel y una foto editorial horizontal 3:2 con identidad preservada. Usa el fondo chroma uniforme y el helper de remoción de key indicado por el skill.
5. Revisa visualmente fuente, cutout y foto modelada. Exige bordes transparentes limpios, cuerpo completo de la prenda, proporciones y detalles fieles, identidad reconocible y sin texto inventado.
6. Usa un único responsable para reconciliar el catálogo, deduplicar identidad física y ejecutar:

    node .agents/skills/import-clothes/scripts/import-to-wardrobe.mjs \
      --items "$WORK/items" --modeled "$WORK/modeled" --manifest "$WORK/manifest.json"

7. Puedes paralelizar auditoría o generación por conjuntos disjuntos. Nadie más debe escribir data/library.json ni producir el mismo slug.

## Máxima paralelización segura

- Usa todos los subagents que la plataforma permita durante el audit y la generación. No esperes a terminar una época antes de abrir los siguientes rangos disjuntos.
- Divide el trabajo por rango temporal o por slugs, nunca por tareas que puedan examinar la misma foto. Cada subagent debe devolver UUIDs, candidatas aceptadas/retenidas, rutas temporales, prompts y notas de QA.
- Mientras los subagents auditan, el coordinador prepara dedupe, manifiestos y la siguiente ola. Mientras generan assets, el coordinador revisa catálogo y diseña las combinaciones.
- Sólo el coordinador puede aprobar la QA final, importar a data/library.json, reconciliar data/outfits.json, regenerar la exportación estática, hacer el merge y desplegar.
- Si hay más candidatas que slots, trabaja por olas encadenadas sin solapamiento hasta agotar el rango decidido; no reduzcas el alcance por comodidad.

## Lookbook

- Dirección aprobada: outfits fuertes y utilizables, no combinatoria exhaustiva.
- Esta delegación autoriza hasta **12 nuevos looks** si hay 12 combinaciones realmente distintas y verificables; si hay menos, no rellenes con variantes débiles.
- Usa cada outfit con exactamente un top y un bottom, más capa, zapatos o accesorio sólo si están en el catálogo y se ven identificables. No reutilices la misma combinación de prendas.
- Busca variedad real: casual, smart-casual, cálido, oscuro tonal, statement y capas cuando corresponda. Balancea el uso de prendas para no caer siempre en los mismos neutros.
- Lee y sigue .agents/skills/generate-outfits/SKILL.md y el template de prompt que referencia. Genera una imagen cuadrada 1:1, encuadre completo cabeza a zapatos, para cada look aceptado.
- QA obligatorio: identidad, anatomía, prenda exacta, logos/texto visibles, silueta, zapatos y todas las capas seleccionadas. Regenera cualquier imagen que sólo sea plausible pero no fiel.

## Verificación y publicación por cada ola

Antes de publicar:

    npm run test:static-export
    node --test src/wardrobe-source.test.js src/outfit-source.test.js src/theme.test.js
    node scripts/static-wardrobe-export.mjs

Publica **sólo preview privado**, nunca producción:

    npx --yes vercel@58.4.4 build --yes
    npx --yes vercel@58.4.4 deploy --prebuilt --target preview --yes
    npx --yes vercel@58.4.4 ls wardrobe-private --yes

No desactives Vercel Authentication. Verifica el último URL con vercel curl: el JSON de biblioteca, el JSON de outfits y al menos un asset nuevo deben responder correctamente. Los assets exportados se sirven bajo /wardrobe/assets/.

## Git y documentación

Siempre usa un branch por ola, crea un commit de documentación, haz merge commit explícito a main, push y sólo después publica el preview. Ejemplo:

    git switch -c codex/<ola>
    git add CLAUDE.md ANTIGRAVITY_HANDOFF.md
    git commit -m "docs: record <ola>"
    git switch main
    git merge --no-ff codex/<ola> -m "Merge branch 'codex/<ola>'"
    git push origin main

No agregues los assets privados a Git. Sí actualiza CLAUDE.md con fecha, rango revisado, prendas, IDs si sirven para dedupe, outfits, conteos finales, holds, URL de preview y validaciones. No hagas reset, checkout destructivo ni limpies el worktree.

## Fuera de alcance por ahora

Benjamín quiere más adelante importar fotos individuales o links de prendas y tener un Builder para probar/reemplazar ítems dentro de un outfit. No implementes esos productos en esta delegación. Sólo documenta necesidades que encuentres.

## Entrega esperada a Benjamín

Al finalizar cada ola, informa brevemente:

1. prendas nuevas y piezas retenidas con motivo;
2. cantidad final de prendas y outfits;
3. tests y QA ejecutados;
4. hash del merge commit y URL del preview protegido;
5. cualquier duda que realmente impida continuar.
