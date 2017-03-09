### Note

* es5 restricted by condition

### How to

````
> npm install
> npm start
````

##### Available commands

* rise num - spawns characters
  ````
  > rise 2

  Fancelot the Careless of Fake was born in 1474335723207
  Thad the Ambitious of Fake was born in 1474335723209  
  ````
* list - show all characters and their status
  ````
  > list

  #1 Fancelot the Careless of Fake is alive
  #2 Thad the Ambitious of Fake is alive
  ````

* kill id - kill character by id from list
  ````
  kill 1
  ````

* crown id - crown character by id from list
  ````
  crown 2
  ````

* punish id - drain error log
  ````
  punish 2
  ````

* massacre id1 id2 idN - mass kill command
  ````
  massacre 1 2 19
  ````

* cleaner - spawn process with "getErrors" attribute
  ````
  cleaner
  ````

* help - helps

#### Running manually

````
node ./src/index.js --name UNIQUE_ID getErrors crowned
````

*getErrors* and *crowned* are optional params

You should first spawn "crowned" process, to avoid collisions with the dead kings of previous runs. Or you could delete list 'royal-family` from redis, and run the workers in any sequence


#### Tests (not so much)

````
npm test
````


#### Game debug

````
gulp game-task
````

Same as "npm start" but with autoreload

#### Requirements

Redis on defual port (6379)
