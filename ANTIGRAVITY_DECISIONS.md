# Decisiones de Diseño e Implementación - Antigravity

Este documento registra las decisiones arquitectónicas y de diseño realizadas por Antigravity.

## [2026-08-02] - Paginación/Límites en el Outfit Builder
**Problema:** Al abrir el "Builder" de outfits, las categorías (Tops, Bottoms, etc.) solo mostraban 8 prendas como máximo, lo que limitaba las opciones de combinación y escondía la mayoría del clóset.
**Decisión:** Se eliminó la restricción `.slice(0, 8)` en el componente `Builder.jsx` para que el panel de sugerencias renderice todas las prendas disponibles dentro de la categoría seleccionada y no haya pérdida de inventario.
**Implementación:** Se modificó la función `getSuggestions` en `src/Builder.jsx`.

## [2026-08-02] - Descomposición de Outfits
**Problema:** Se necesitaba poder inspeccionar de qué prendas individuales estaba compuesto un look específico.
**Decisión:** Se agregó un modal interactivo (`OutfitViewer`) al hacer clic en las `OutfitCard`. Este modal carga tanto la imagen modelada principal del outfit, como una cuadrícula iterando todos los `garmentIds` referenciados, mostrando las prendas individuales que lo componen.
## [2026-08-02] - Lógica Avanzada de Sugerencias en el Builder
**Problema:** Las sugerencias de combinación del Builder eran muy básicas (sólo color distinto y tags solapados).
**Decisión:** Se implementó una lógica de afinidad mejorada en `calculateCompatibility` (Builder.jsx) que evalúa combinaciones de colores (monocromático vs contraste), detecta estilos que chocan (ej. athletic vs formal), fomenta cruces versátiles (denim con todo) e incrementa el score si los tags de temporada coinciden.

## [2026-08-02] - Guardado Local de Outfits Personalizados
**Problema:** El botón "Save Outfit" del Builder no tenía una acción real asignada, por lo que las combinaciones se perdían.
**Decisión:** Al no haber un endpoint backend habilitado aún para guardar outfits permanentemente en `data/outfits.json`, se habilitó la persistencia local vía `localStorage`. Ahora los outfits armados por el usuario se guardan, se muestran en la pestaña "Outfits" y pueden descomponerse en el visor (OutfitViewer) al igual que los generados oficialmente, permitiendo probar y guardar combinaciones sin perderlas al refrescar.

## [2026-08-02] - Previsualización Interactiva ("Paper Doll") en Builder
**Problema:** El usuario solicitó poder ver cómo lucen las prendas sobre su cuerpo mientras selecciona, pero generar una imagen modelada por IA para cada combinación en tiempo real es inviable por los tiempos de espera y límites de cuota (API). Además, la vista previa anterior sólo se veía al volver a la pantalla de inicio, rompiendo el flujo.
**Decisión (Iteración 1):** Se implementó un "Paper Doll" superponiendo prendas en CSS sobre el avatar (`model-reference.png`). Fracasó porque los recortes tenían proporciones distintas, luciendo "horrible" y desalineado.
**Decisión (Iteración Final - Interactive Fitting Room):** En lugar de usar el avatar base, el panel utiliza el `modeledImage` de la prenda principal seleccionada (Chaqueta o Top) como fondo dinámico, aprovechando que la IA ya renderizó esa prenda perfectamente sobre el cuerpo del usuario. Las prendas secundarias (ej: pantalones, zapatos) se superponen sobre este fondo, pero ahora son **interactivas**: el usuario puede arrastrarlas libremente y usar la rueda del mouse para escalar su tamaño y lograr el calce perfecto, resolviendo el problema de proporciones sin consumir cuota de IA adicional.

-- 
*Firmado por: Antigravity (agy)*
