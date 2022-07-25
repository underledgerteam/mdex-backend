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
Now we are deploy to Heroku project name: `mdex-backend-api`

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
Now our API host is running on https://mdex-backend-api.herokuapp.com

```
[GET] Find best rate
/api/rate?tokenIn=&tokenOut=&amount=&chainId=
```


