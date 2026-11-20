// Chapter 1 · Introduction to SPARQL.
// Tasks adapted from Scopoli · MAM04 (https://koetai.github.io/scopoli-mam04/): GREN, ALLC, PREF, CNTA.
// Each task runs live against a public endpoint through Comunica. "Submit" compares the
// student's result with the reference `solution` on the `check` variables.

export const ENDPOINTS = {
  dbpedia: {
    name: 'DBpedia', url: 'https://dbpedia.org/sparql',
    ui: (q) => 'https://dbpedia.org/sparql?qtxt=' + encodeURIComponent(q),
  },
  wikidata: {
    name: 'Wikidata', url: 'https://query.wikidata.org/sparql',
    ui: (q) => 'https://query.wikidata.org/#' + encodeURIComponent(q),
    // The Wikidata query service predefines these; Comunica parses the query first, so we add them.
    prefixes: {
      wd: 'http://www.wikidata.org/entity/', wdt: 'http://www.wikidata.org/prop/direct/',
      wikibase: 'http://wikiba.se/ontology#', bd: 'http://www.bigdata.com/rdf#',
      p: 'http://www.wikidata.org/prop/', ps: 'http://www.wikidata.org/prop/statement/',
      pq: 'http://www.wikidata.org/prop/qualifier/', schema: 'http://schema.org/',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    },
  },
};

export const REFS = {
  rdf11: { authors: 'Cyganiak R, Wood D, Lanthaler M', year: 2014, title: 'RDF 1.1 Concepts and Abstract Syntax', venue: 'W3C Recommendation', url: 'https://www.w3.org/TR/rdf11-concepts/' },
  dbpedia: { authors: 'Lehmann J, Isele R, Jakob M, et al.', year: 2015, title: 'DBpedia – A large-scale, multilingual knowledge base extracted from Wikipedia', venue: 'Semantic Web 6(2):167–195', doi: '10.3233/SW-140134' },
  sparql11: { authors: 'Harris S, Seaborne A', year: 2013, title: 'SPARQL 1.1 Query Language', venue: 'W3C Recommendation', url: 'https://www.w3.org/TR/sparql11-query/' },
  wikidata: { authors: 'Vrandečić D, Krötzsch M', year: 2014, title: 'Wikidata: a free collaborative knowledgebase', venue: 'Communications of the ACM 57(10):78–85', doi: '10.1145/2629489' },
};

const DBP = 'PREFIX dbo: <http://dbpedia.org/ontology/>\nPREFIX dbp: <http://dbpedia.org/property/>\nPREFIX dbr: <http://dbpedia.org/resource/>\n';
const LABEL = 'SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }';
const pre = (q) => `<pre>${q.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`;

const Q = {
  green: 'select ?p ?o\nwhere { <http://dbpedia.org/resource/Green_curry> ?p ?o }',
  allCurries: 'select ?s ?country\nWHERE {\n  ?s <http://dbpedia.org/ontology/type> <http://dbpedia.org/resource/Curry> .\n  ?s <http://dbpedia.org/ontology/country> ?country .\n}\nORDER BY ?country',
  thaiLiteral: DBP + 'select ?s\nWHERE {\n  ?s dbo:type dbr:Curry .\n  ?s dbp:country "Thailand"@en .\n}',
  curryAllergy: `SELECT DISTINCT ?curry ?curryLabel ?ingredientLabel ?allergy ?allergyLabel\nWHERE {\n  ?curry wdt:P279* wd:Q164606 .\n  ?curry wdt:P186 ?ingredient .\n  ?allergy wdt:P279* wd:Q769815 .\n  ?allergy wdt:P828 ?ingredient .\n  ${LABEL}\n}\nORDER BY ?curryLabel`,
  perAllergy: `SELECT ?allergy ?allergyLabel (COUNT(DISTINCT ?curry) AS ?n)\nWHERE {\n  ?curry wdt:P279* wd:Q164606 .\n  ?curry wdt:P186 ?ingredient .\n  ?allergy wdt:P279* wd:Q769815 .\n  ?allergy wdt:P828 ?ingredient .\n  ${LABEL}\n}\nGROUP BY ?allergy ?allergyLabel\nORDER BY DESC(?n)`,
};

export const CHAPTER = {
  id: 'ch1',
  number: 1,
  title: 'Introduction to SPARQL',
  quiz: { name: 'SPARQL quiz', url: 'https://canvas.uva.nl/courses/59376/quizzes/128232?module_item_id=2826720' },
  intro: `<p>SPARQL is the query language for linked data. Linked data is a web of <b>triples</b>
    (subject, predicate, object), and a SPARQL query describes a pattern of triples with some parts left open as
    <b>variables</b>. The endpoint returns every way the pattern matches its data.</p>
    <p>In this chapter you query two public, crowd-sourced knowledge graphs, <b>DBpedia</b> and <b>Wikidata</b>, about
    curry: from all facts about one dish, through all curries and the shorthand of prefixes, to counting which food
    allergies curries can trigger. Each task runs live, answer the related questions on
    <a href="https://canvas.uva.nl/courses/59376/quizzes/128232?module_item_id=2826720" target="_blank" rel="noopener">Canvas</a>.</p>
    <p>Both sources are crowd-sourced. Expect missing results, duplicates and inconsistent representations, and expect
    counts to change slightly over time. For background, see pages 38–46 of <i>Semantics for Dummies</i> and the
    SPARQL lecture slides.</p>`,
  tasks: [
    {
      id: 'GREN', endpoint: 'dbpedia', title: 'Everything about green curry', concept: 'Triple patterns',
      story: `<p>DBpedia is a crowd-sourced effort to extract structured information from Wikipedia and publish it as linked data. Every fact is a <b>triple</b>: subject, predicate, object. In <i>Semantics for Dummies</i> (p. 39) a query asks for all predicates and objects of one subject. We do the same for Thai green curry.</p>`,
      lesson: `<p>In <code>?p ?o</code> the question marks make <i>variables</i>. The subject is fixed: the DBpedia resource for green curry. The endpoint returns every predicate–object pair it has for that subject.</p>
        <p>Among the results is this line:</p>${pre('http://www.w3.org/1999/02/22-rdf-syntax-ns#type   http://dbpedia.org/ontology/Food')}
        <p>It means: green curry <i>is a</i> (has type) Food. All predicates and most objects are links; click a few. An object that is not a link is a <b>literal</b>: a piece of text or a number.</p>`,
      task: `<p><b>Run the query in the editor</b> (▶ Run), look through the results, then press <b>Submit answer</b>.</p>`,
      returns: ['p', 'o'], check: ['p', 'o'],
      starter: Q.green, solution: Q.green,
      explain: 'You asked for every triple whose subject is dbr:Green_curry. Notice how many different predicates describe one dish, and that some objects are links while others are text.',
      refs: ['rdf11', 'dbpedia'],
    },
    {
      id: 'ALLC', endpoint: 'dbpedia', title: 'Find all curries', concept: 'Variables in subject position',
      story: `<p>Now we want other curries. We keep the predicate and object fixed and search for subjects, which we call <code>?s</code>. The name is arbitrary (<code>?dish</code>, <code>?qwerty</code>); the question mark makes it an unbound variable.</p>`,
      lesson: `<p>Each triple ends with a period, “.”. Read the period as AND: we want subjects whose type is Curry <b>and</b> that have a country. <code>ORDER BY</code> sorts the results by country.</p>`,
      task: `<p><b>Run the query</b>, look at the results and <b>Submit</b>. Which countries have the most curries? Is green curry among them?</p>`,
      returns: ['s', 'country'], check: ['s', 'country'],
      starter: Q.allCurries, solution: Q.allCurries,
      explain: 'Two triple patterns share the variable ?s, so only subjects that match both are returned. Green curry is missing: its dbo:type is dbr:Thai_curry, not dbr:Curry, and SPARQL matches exactly what is written. Knowing that a Thai curry is a kind of curry takes a hierarchy — an ontology.',
      refs: ['sparql11'],
    },
    {
      id: 'PREF', endpoint: 'dbpedia', title: 'Prefixes and literals', concept: 'PREFIX, literals',
      story: `<p>Long IRIs are tiring, so we define shorthands with <code>PREFIX</code>. A prefix covers everything up to the last <code>#</code> or <code>/</code>. Its name, ending in a colon, can be anything, but usually it's a recognisable abbreviation.</p>`,
      lesson: `<p>DBpedia uses two namespaces for predicates. <code>dbo:</code> (<code>http://dbpedia.org/ontology/</code>) holds curated ontology properties. <code>dbp:</code> (<code>http://dbpedia.org/property/</code>) holds raw properties copied straight from Wikipedia infoboxes. Raw properties often give text where you'd expect a link.</p>
        <p>An object can be a literal: text in quotes with a language tag, such as <code>"Thailand"@en</code>. Numbers and dates carry a datatype instead, shown with <code>^^</code>: a year appears as <code>"2016"^^xsd:gYear</code>.</p>`,
      task: `<p><b>Devise</b> a query, using the prefixes in the editor, for all curries (<code>dbo:type dbr:Curry</code>) whose raw country <code>dbp:country</code> is the literal <code>"Thailand"@en</code>.</p>`,
      hint: 'Two triple patterns that share ?s, each ending with a period. Write the literal exactly as "Thailand"@en.',
      returns: ['s'], check: ['s'],
      starter: DBP + 'select ?s\nWHERE {\n  \n}',
      solution: Q.thaiLiteral,
      explain: 'With prefixes, dbr:Curry stands for &lt;http://dbpedia.org/resource/Curry&gt;. The object "Thailand"@en is a literal, not a link. Try dbr:Thailand instead: you get a different set of curries.',
      refs: ['sparql11'],
    },
    {
      id: 'CNTA', q: 23, endpoint: 'wikidata', title: 'Curries per allergy', concept: 'GROUP BY on a join',
      story: `<p>Wikidata is another crowd-sourced knowledge graph. Its items have numeric identifiers: <code>wd:Q164606</code> is curry, <code>wd:Q769815</code> is food allergy. <code>wdt:P279</code> is “subclass of”, <code>wdt:P186</code> “made from material” (ingredient) and <code>wdt:P828</code> “has cause”. The <code>*</code> in <code>wdt:P279*</code> follows subclass links zero or more times, and the label service adds English names as <code>?…Label</code>.</p>
        <p>The query in the editor connects the dish to the disease through the ingredient: it lists which curries contain an ingredient that causes a food allergy. Run it first.</p>`,
      lesson: `<p>For an allergist, the question turns around: for each allergy, how many curries are risky? <code>GROUP BY</code> collects rows with the same values, and an aggregate such as <code>(COUNT(DISTINCT ?curry) AS ?n)</code> computes one number per group. Every selected variable that is not an aggregate must be in the <code>GROUP BY</code>.</p>`,
      task: `<p>Adapt the query to show, for each allergy, the number of different curries that can trigger it, in descending order.</p>`,
      hint: 'SELECT ?allergy ?allergyLabel and a COUNT(DISTINCT ?curry) AS ?n; GROUP BY ?allergy ?allergyLabel; ORDER BY DESC(?n).',
      returns: ['allergy', 'allergyLabel', 'n'], check: ['allergy', 'n'],
      starter: Q.curryAllergy, solution: Q.perAllergy,
      // Used only when Wikidata won't answer the reference query (e.g. rate limiting): ?allergy │ ?n
      recorded: { date: '20 November 2026', keys: [
        'http://www.wikidata.org/entity/Q3232749 │ 12', 'http://www.wikidata.org/entity/Q23037762 │ 3',
        'http://www.wikidata.org/entity/Q102294249 │ 3', 'http://www.wikidata.org/entity/Q576179 │ 2',
        'http://www.wikidata.org/entity/Q7157933 │ 1', 'http://www.wikidata.org/entity/Q5171043 │ 1',
        'http://www.wikidata.org/entity/Q25326648 │ 1'] },
      explain: 'COUNT(DISTINCT ?curry) per allergy. A count of curries says nothing about how often the allergy occurs in patients: garlic allergy tops the list, but it is rare.',
      refs: ['sparql11', 'wikidata'],
    },
  ],
};
