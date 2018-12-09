# challonge-bot

Challonge bot for Slack


# Installation

1. Copy `challonge.json.example` to `challonge.json` and enter Challonge organization sub-domain and Challonge user API key.

2. Create Slack app.

3. Follow [Claudia set-up instructions](https://claudiajs.com/tutorials/installing.html) and deploy to AWS:
   ```
   npx claudia create --region eu-west-1 --api-module index --configure-slack-slash-app --profile claudia
   ```

# Re-deploy / update
```
npx claudia update --cache-api-config --profile claudia
```


# License

Licenced under the [MIT License](LICENSE).
