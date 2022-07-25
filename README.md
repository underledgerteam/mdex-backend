Get best rate swapping API with Node.js and Express

## Run App

Install dependencies
```
$ npm install
```

start app
```
$ node index.js
``` 

## Deploy to Heroku

```
git add .
git commit -m ""
git push heroku master
```

Heroku will deploy automatically when we push new file to git

### Heroku log
```
heroku logs --tail
```

Deploy to Heroku git: `https://git.heroku.com/mdex-backend-api.git` and environment have to change in Heroku project setting.


## Endpoint
[GET] Find best rate
```
/api/rate?tokenIn=&tokenOut=&amount=&chainId=
```


