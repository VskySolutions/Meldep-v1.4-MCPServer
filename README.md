# meldep-mcp

npm whoami
> vsky-solutions
npm version patch/major/minor
npm config set //registry.npmjs.org/:_authToken <access token>
npm publish --access public


### connect to claude desktop

claude config
```json
"meldep": {
    "command": "npx",
    "args": [
        "-y",
        "@vsky-solutions/meldep-mcp",
        "--username",
        "<meldep username>",
        "--password",
        "<meldep password>",
        "--projectId",
        "<meldep project id>"
    ]
}
```

### Connect to claude code
```bash
claude mcp add --transport stdio meldep -- npx -y @vsky-solutions/meldep-mcp --username <username> --password <Password> --projectId <Project Id>
```
