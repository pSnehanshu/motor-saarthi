# Run in prod

```bash
docker build -t motor-saarthi .

docker run -d -p 8080:80 -e DATABASE_URL="postgresql://postgres:1234@172.17.0.1:5432/motor-saarthi?schema=public" --name motor-saarthi motor-saarthi
```
