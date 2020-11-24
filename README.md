# deno-serverless

Learning Deno, Learning Serverless.
学习腾讯云云函数部署Deno服务


## Run

```bash
deno run --allow-net --allow-read --allow-env  index.ts
```

## Run in Tencent Cloud Function

1. `deno` 文件上传到层，并绑定到云函数
2. `bootstrap` 文件中修改 `deno` 的路径， 如 `/opt/deno`
3. 配置云函数环境变量
4. 根据需求添加触发管理