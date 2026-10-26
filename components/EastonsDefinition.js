import React, { useState } from "react";
import { Text, View } from "react-native";
import { getDictionaryEntries } from "../services/bibleDatabase";

const SEE_REFERENCE = /\(See ([A-Z][A-Z '\-’]+)\.\)/g;

export default function EastonsDefinition({ definition, style, linkStyle }) {
  const [linkedEntries, setLinkedEntries] = useState([]);
  const [linkedTerm, setLinkedTerm] = useState("");
  const paragraphs = String(definition || "").split(/\n\s*\n/);

  function renderParagraph(paragraph, paragraphIndex) {
    const pieces = [];
    let lastIndex = 0;
    let match;

    SEE_REFERENCE.lastIndex = 0;
    while ((match = SEE_REFERENCE.exec(paragraph)) !== null) {
      const entries = getDictionaryEntries(match[1]);
      if (entries.length === 0) continue;

      pieces.push(paragraph.slice(lastIndex, match.index));
      pieces.push(
        <Text
          key={`see-${paragraphIndex}-${match.index}`}
          style={linkStyle}
          onPress={() => {
            setLinkedTerm(match[1]);
            setLinkedEntries(entries);
          }}
        >
          (See {match[1]})
        </Text>
      );
      lastIndex = match.index + match[0].length;
    }
    pieces.push(paragraph.slice(lastIndex));

    return <Text key={`paragraph-${paragraphIndex}`} style={style}>{pieces}</Text>;
  }

  return (
    <View>
      {paragraphs.map(renderParagraph)}
      {linkedEntries.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Text style={[style, { fontWeight: "700" }]}>{linkedTerm}</Text>
          {linkedEntries.map((entry) => (
            <View key={entry.id} style={{ marginTop: 6 }}>
              {linkedEntries.length > 1 ? <Text style={style}>{entry.word}</Text> : null}
              <Text style={style}>{entry.definition}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}