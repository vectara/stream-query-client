// Search results.
const chunk1 = `event:search_results
data:{"type":"search_results","search_results":[{"text":"(If you're not a Markdown Here user, check out the Markdown Cheatsheet that is not specific to MDH. But, really, you should also use Markdown Here, because it's awesome. http://markdown-here.com)","score":0.7467775344848633,"part_metadata":{"lang":"eng","offset":648,"len":25},"document_metadata":{"date":"2021-02-25T10:03:47Z","Total-Time":6,"extended-properties:AppVersion":12.0,"meta:paragraph-count":8,"meta:word-count":83,"Word-Count":83,"dcterms:created":"2021-02-25T10:03:47Z","meta:line-count":12,"dcterms:modified":"2021-02-25T10:03:47Z","Last-Modified":"2021-02-25T10:03:47Z","Last-Save-Date":"2021-02-25T10:03:47Z","meta:character-count":475,"Template":"Normal.dotm","Line-Count":12,"Paragraph-Count":8,"meta:save-date":"2021-02-25T10:03:47Z","meta:character-count-with-spaces":583,"Application-Name":"Microsoft Word 12.0.0","extended-properties:TotalTime":6,"modified":"2021-02-25T10:03:47Z","Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","X-Parsed-By":"org.apache.tika.parser.microsoft.ooxml.OOXMLParser","meta:creation-date":"2021-02-25T10:03:47Z","extended-properties:Application":"Microsoft Word 12.0.0","Creation-Date":"2021-02-25T10:03:47Z","xmpTPg:NPages":1,"Character-Count-With-Spaces":583,"Character Count":475,"Page-Count":1,"Application-Version":12.0,"extended-properties:Template":"Normal.dotm","extended-properties:DocSecurityString":"None","meta:page-count":1},"document_id":"914e8885-1a65-4b56-a279-95661b264f3b"}]}`;

// Chat info.
const chunk2 = `event:chat_info
data:{"type":"chat_info","chat_id":"cht_74b5a5f3-1f51-4427-a317-f62efb493928","turn_id":"trn_74b5a5f3-1f51-4427-a317-f62efb493928"}`;

// Generation.
const chunk3 = `event:generation_chunk
data:{"type":"generation_chunk","generation_chunk":"Markdown is "}`;

// FCS.
const chunk4 = `event:factual_consistency_score
data:{"type":"factual_consistency_score","factual_consistency_score":0.41796625}`;

// // End.
const chunk5 = `event:end
data:{"type":"end"}`;

export const chunks = [chunk1, chunk2, chunk3, chunk4, chunk5];
