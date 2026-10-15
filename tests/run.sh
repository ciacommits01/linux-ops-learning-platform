#!/bin/sh
# Plays every mission with a scripted solution (needs Node.js)
cat src/world.js src/shell.js src/cmds_a.js src/cmds_b.js src/cmds_c.js src/data.js tests/solutions.js tests/runner.js > /tmp/ops-arena-test.js && node /tmp/ops-arena-test.js
