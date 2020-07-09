install:
	npm install

publish:
	npm run build
	npm publish

run:
	npx babel-node src/bin/index.js
	
lint:
	npx eslint .

debug:
	npm run debug

test: 
	npm run test

test-coverage:
	npm run test -- --coverage