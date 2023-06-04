#!/bin/bash

OUTPUT_FILE="mermaid_chart.md"

echo "graph TD" > $OUTPUT_FILE

tree -fi --noreport -I 'node_modules|.*|*.json|*build*|*dist*|public|assets|*config*' | while read -r line; do
  parent=$(dirname "$line")
  child=$(basename "$line")
  parent_id="${parent//\//-}"
  child_id="${child//\//-}"
  echo "${parent_id}[${parent}] --> ${child_id}[${child}]" >> $OUTPUT_FILE
done

echo "Mermaid chart generated in $OUTPUT_FILE"