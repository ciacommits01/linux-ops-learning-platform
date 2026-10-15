#!/bin/sh
# Rebuilds index.html from src/
cat src/head.html src/world.js src/shell.js src/cmds_a.js src/cmds_b.js src/cmds_c.js src/data.js src/ui.js > index.html
printf '</script></body></html>\n' >> index.html
echo "Built index.html"
