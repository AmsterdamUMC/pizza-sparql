# SPARQL Practical (MAM04)

The second practical of *Reasoning with Health Data* (MAM04, Master Medical Informatics, UvA /
Amsterdam UMC), live at https://amsterdamumc.github.io/pizza-sparql/. Everything runs in the browser
with [Comunica](https://comunica.dev), so it is hosted on GitHub Pages without a server.

- **Chapter 1 · Introduction to SPARQL** (`#/ch1`): four tasks adapted from
  [Scopoli · MAM04](https://koetai.github.io/scopoli-mam04/) (GREN, ALLC, PREF, CNTA), run live on
  DBpedia and Wikidata. *Submit answer* compares the student's result with a reference query on the
  checked variables. Task text, starters and solutions live in `docs/chapter1.js`.
- **Chapter 2 · The pizza ontology** (`#/pizza`): the GraphDB replacement, querying the encrypted
  pizza ontology locally.

## Acknowledgements

This tool is built on [Comunica](https://comunica.dev), an open-source (MIT) modular SPARQL query
engine developed at IDLab, Ghent University – imec. We are grateful to the Comunica team for making
it freely available. If you use it, please cite:

> Ruben Taelman, Joachim Van Herwegen, Miel Vander Sande, Ruben Verborgh.
> *Comunica: a Modular SPARQL Query Engine for the Web.* Proceedings of the 17th International
> Semantic Web Conference (ISWC 2018). https://doi.org/10.1007/978-3-030-00668-6_15

Also used: [N3.js](https://github.com/rdfjs/N3.js) (RDF parsing and in-memory store),
[CodeMirror 5](https://codemirror.net/5/) (query editor), and the Pizza ontology from the
University of Manchester Pizza Tutorial (CO-ODE).

## How the password protection works

GitHub Pages can't do server-side logins, so the data itself is encrypted:

- `source/pizza.ttl` (the pizza ontology, converted from `pizzaExample.owl`) is encrypted with AES-256-GCM
  into `docs/data/pizza.enc`.
- The decryption key is wrapped once per user, using a key derived from `username:password`
  (PBKDF2-SHA256, 250k rounds) and stored in `docs/data/keys.json`.
- At sign-in the browser derives the key, decrypts the data, loads it into an in-memory store and
  Comunica queries that. Without valid credentials the published files are unreadable.

Limits: anyone with a valid user name and password can download the decrypted data (that is the
point), and the page code is public. The pizza ontology is public anyway, so this mainly keeps the
page for the course. Because the inferred class hierarchy is already in the source file
(e.g. `Rosa rdfs:subClassOf CheeseyPizza`), no reasoner is needed.

## Files

| Path | Published? | What it is |
|---|---|---|
| `docs/` | yes (GitHub Pages) | `index.html`, `chapter1.js`, `vendor/comunica-browser.js` (official Comunica 4.5 browser build), `vendor/engine.js` (N3 + decryption), `data/*.enc`, `data/keys.json`, `img/` (logos) |
| `source/*.ttl` | **no** (git-ignored) | plaintext data, all `.ttl` files are loaded |
| `users.local.json` | **no** (git-ignored) | `{ "username": "password", ... }` |
| `src/`, `scripts/build.mjs` | yes (harmless) | source of the bundle and the build/encrypt script |

## Build

```bash
npm install
```

```bash
node scripts/build.mjs
```

Re-run the build after changing users or data. Every build makes a new key, so old sessions are
signed out.

Convert a new OWL/XML file to Turtle with ROBOT:

```bash
java -jar robot.jar convert --input pizzaExample.owl --format ttl --output source/pizza.ttl
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository (the `.gitignore` keeps `source/` and `users.local.json` out).
2. Repository → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/docs`.
3. The site appears at `https://<user>.github.io/<repo>/`.

## Saved queries

`PizzaLabel` (as in the old GraphDB repository): named pizzas that are a `CheeseyPizza`, with their
label. It contains one commented-out line (`#?pizza rdfs:subClassOf pizza:MeatyPizza .`) shown in brown.

- As saved: **22** cheesy pizzas.
- With the `#` removed: **9** meaty and cheesy pizzas (American, AmericanHot, Capricciosa,
  FourSeasons, LaReine, Parmense, PolloAdAstra, Siciliana, SloppyGiuseppe).
- Other information: the `label` column holds the Portuguese names (`@pt`, e.g. Mushroom → Cogumelo).
  Clicking a pizza shows all its statements: superclasses, toppings (`hasTopping some …`),
  country of origin, disjoint classes.

Also: `PizzaToppings`, `NamedPizzas`, `ObjectProperties`, `Individuals`, `CountTriples`.

## Replacement quiz text (GraphDB section only; the Protégé part stays the same)

> Now we will look at the same ontology in a SPARQL query tool.
>
> N.B. A triplestore is a database specifically designed to store triples of an RDF file and
> retrieve data using SPARQL queries. Here the triples are loaded into your browser and queried
> with Comunica, a SPARQL engine that runs in the browser.
>
> Go to **https://&lt;user&gt;.github.io/&lt;repo&gt;/** and sign in with the following credentials
>
> **Username:** student
> **Password:** (see users.local.json)
>
> In this tool you can query the ontology graph. You can look at classes and instances or search
> for specific parts of the graph.
>
> **Question 5.** Let's do a query on the ontology by searching for pizzas with a cheese topping.
> Choose the saved query **PizzaLabel** from the list on the left and press **Run**.
> The result is presented in a table. The links in the column "pizza" give more information on the class.
> How many cheesey pizzas do you find as a result of the SPARQL query?
>
> **Question 6.** The query PizzaLabel has one line that is inactivated with a # (displayed in brown).
> Remove the # alone (now the text colours should match the other lines). **Run** the full query again.
> How many meaty and cheesey pizzas do you find? What other information can you find on the pizzas?
