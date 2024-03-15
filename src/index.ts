import "dotenv/config";
import { Telegraf, Markup, Context } from "telegraf";
import { EventEmitter } from "events";
import { Pair } from "./types";

const quee: number[] = [];
const pairs: Pair[] = [];

const queeEvents = new EventEmitter();

const { BOT_TOKEN } = process.env;
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');
const bot = new Telegraf(BOT_TOKEN);

const findInline = Markup.inlineKeyboard([Markup.button.callback("Найти собеседника", "find")]);
const leaveInline = Markup.inlineKeyboard([Markup.button.callback("Закончить беседу", "leave")]);

queeEvents.addListener("add", (id: number) => {
  if (!quee.find((elem) => elem === id)) {
    quee.push(id);
  }
  if (quee.length > 1) {
    const first = quee.shift()!;
    const second = quee.shift()!;
    bot.telegram.sendMessage(first, "Собеседник Найден!", leaveInline);
    bot.telegram.sendMessage(second, "Собеседник Найден!", leaveInline);
    pairs.push({
      first,
      second,
    });
  }
});

queeEvents.addListener("delete", (id: number) => {
  const pair = pairs.findIndex((elem) => elem.first === id || elem.second === id);
  if (pair === -1) return;
  const { first, second } = pairs[pair];
  pairs.splice(pair, 1);
  bot.telegram.sendMessage(id===first ? second : first, "Собеседник покинул беседу", findInline);
});

bot.start((ctx) => ctx.reply("Дарова йоу, ку-ку ее!", findInline));

const addToQuee = (ctx: Context) => {
  ctx.reply("В поисках собеседника...");
  queeEvents.emit("add", ctx.chat?.id);
  return;
};
const leaveChat = (ctx: Context) => {
  ctx.reply("Вы покинули беседу.", findInline);
  queeEvents.emit("delete", ctx.chat?.id);
  return;
};

bot.action("find", addToQuee);
bot.command("find", addToQuee);
bot.action("leave", leaveChat);
bot.command("leave", leaveChat);
bot.on("message", (ctx) => {
  const id = ctx.chat.id;
  const pair = pairs.find((elem) => elem.first === id || elem.second === id);
  if (pair) {
    const sendId = pair.first === id ? pair.second : pair.first;
    ctx.copyMessage(sendId);
  }
});

bot.launch();
