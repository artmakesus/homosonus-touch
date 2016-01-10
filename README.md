Homosonus
=========
An interactive sound installation based on human touch interaction

Requirements
------------
* [Node](https://nodejs.org)

Setup
-----
1. Go to `public` folder and run `npm install`

Run
---
1. Run `node main.js`
2. (optional) Go to `localhost:8080` in a browser to try the simulation.
3. (optional) Listen to `localhost:7070` as an OSC server at address `/data/0` to `/data/n` (`n` may vary).

Development
-----------
1. In the `public` folder, run `webpack --watch`
2. In the `public/js/components`, run `babel --presets react,es2015,stage-0 --watch src --out-dir build`
3. Now you can edit the code at the `public` folder (probably mostly `public/js/components/src/App.js')
