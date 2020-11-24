/*
* Copyer huqi
* https://github.com/hu-qi
*/
import * as log from "https://deno.land/std@0.79.0/log/mod.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";
import {
  differenceInDays,
  format,
} from "https://deno.land/x/date_fns@v2.15.0/index.js";
import { zhCN } from "https://deno.land/x/date_fns@v2.15.0/locale/index.js";
import "https://deno.land/x/dotenv/load.ts";

// 很随意的入参，来自.env
const {
  SEND_EMAIL,
  PASSWORD,
  RECV_EMAIL,
  NAME_GIRL,
  CITY,
  CUTDOWNDATE,
  CUTDOWNTHINGS,
} = Deno.env.toObject();

// 很随意的API，来自掘金
const URL = {
  weather: `http://wthrcdn.etouch.cn/weather_mini?city=${CITY}`,
  soup: "https://www.iowen.cn/jitang/api/",
  pi: "https://chp.shadiao.app/api.php",
};

// 先配置下邮箱服务，管他行不行
const client = new SmtpClient();

const connectConfig: any = {
  hostname: "smtp.163.com",
  port: 25,
  username: SEND_EMAIL,
  password: PASSWORD,
};

// 姑且认为返回的都是结构数据
async function _html(url: string): Promise<string> {
  return await (await fetch(url)).text();
}

// 目标城市的天气
async function getWeather(url: string) {
  let data = await _html(url);
  if (data.indexOf("OK") > -1) {
    let _data = JSON.parse(data).data;
    const { ganmao, wendu, forecast } = _data;
    const weather = forecast[0].type;
    return `天气：${weather} 当前温度：${wendu}
          ${ganmao}`;
  } else {
    return "亲爱的，今天天气真奇妙！";
  }
}

// 倒计时
function getTime() {
  const today = format(new Date(), "PPPP", { locale: zhCN, timeZone: 'Asia/Shanghai' });
  const days = differenceInDays(new Date(CUTDOWNDATE), new Date());

  return `今天是${today} ${CUTDOWNTHINGS}倒计时：${days}天`;
}

// 心灵鸡汤
async function getSoup(url: string) {
  let data = await _html(url);
  if (data.indexOf("数据获取成功") > -1) {
    let _data = JSON.parse(data).data;
    const { content } = _data.content;
    return content;
  } else {
    return `高考在昨天，${CUTDOWNTHINGS}在明天，今天没有什么事儿！`;
  }
}

// 彩虹🌈屁？
async function getPi(url: string) {
  let data = await _html(url);
  return data.length > 3 ? data : "你上辈子一定是碳酸饮料吧，为什么我一看到你就开心的冒泡";
}

// 早安
async function morning() {
  return `
          <p>${getTime()}</p>
          <p>${await getSoup(URL.soup)} </p>
          <p>${await getWeather(URL.weather)} </p>
          <p>${await getPi(URL.pi)}</p>
      `;
}

// 晚安
async function ngiht() {
  return `
          <p>${await getSoup(URL.soup)} </p>
          <p>${await getPi(URL.pi)} </p>
          <p>晚安，${NAME_GIRL}同学，今天你也是最棒的，继续加油鸭！</p>
      `;
}

// 日期插件有点屌
function getTimeX() {
  // 返回 “上午” 或者 “下午”
  return format(new Date(), "aaaa", { locale: zhCN, timeZone: 'Asia/Shanghai' });
}

// 入口函数
async function main_handler() {
  // 邮件正文
  console.log(getTimeX())
  const content = getTimeX() === "上午" ? await morning() : await ngiht();
  // 邮件标题
  const greeting = getTimeX() === "上午"
    ? `早安， ${NAME_GIRL}`
    : `晚安，${NAME_GIRL} `;

  // "及时关注可能会发生的错误"
  try {
    await client.connect(connectConfig);
    await client.send({
      from: SEND_EMAIL,
      to: RECV_EMAIL,
      subject: greeting,
      content: content,
    });
    await client.close();
    log.info("send email success");
  } catch (error) {
    // "现在开始执行B计划",
    // "与其关心程序的异常，不如多关注下身边的女孩子吧"
    log.error(error);
    log.info("Error: send email fail");
  }
  log.info(content);
  return content;
}

// do initialize
const scf_host: string | undefined = Deno.env.get("SCF_RUNTIME_API");

const scf_port: string | undefined = Deno.env.get("SCF_RUNTIME_API_PORT");

const func_name: string | undefined = Deno.env.get("_HANDLER");

const ready_url = `http://${scf_host}:${scf_port}/runtime/init/ready`;

const event_url = `http://${scf_host}:${scf_port}/runtime/invocation/next`;

const response_url =
  `http://${scf_host}:${scf_port}/runtime/invocation/response`;

const error_url = `http://${scf_host}:${scf_port}/runtime/invocation/error`;

// post ready -- finish initialization
console.log(`post ${ready_url}`);

postData(ready_url, { msg: "deno ready" }).then((data) => {
  console.log(`Initialize finish`);
});

async function processEvent(evt='') {
  if (evt.length === 0) {
    postData(error_url, {msg: "error handling event"}).then(data => {
      console.log(`Error response: ${data}`);
    });
  } else {
    postData(response_url, {msg:`finish process event`}).then(data => {
      console.log(`invoke response: ${data}`);
    });
  }
}

// Example POST method implementation:
async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response.text(); // parses JSON response into native JavaScript objects
}

while (true) {
  // get event
  const responseEmail = await main_handler();
  const response = await fetch(event_url);
  response.text().then(function(text) {
    console.log(`get event: ${text}`);
    processEvent(text);
  });
}
