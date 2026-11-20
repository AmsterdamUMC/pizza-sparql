# Pizza SPARQL (GraphDB replacement)

A static SPARQL workbench for the pizza practical. It runs [Comunica](https://comunica.dev)
entirely in the browser, so it can be hosted on GitHub Pages: no server needed.

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
| `docs/` | yes (GitHub Pages) | `index.html`, `vendor/engine.js` (Comunica + N3 bundle), `data/*.enc`, `data/keys.json` |
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
