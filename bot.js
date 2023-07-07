const TelegramBot = require("node-telegram-bot-api");
const { getAllResponses, postResponse, mutateAllResponses } = require("./db/responses");

const token = "5804913445:AAE_vH9TJoPTnaKIzc65YHz2h2WssOcTv8c";

const bot = new TelegramBot(token, { polling: true });

// Объект для хранения данных о каждом пользователе
const userData = {};

// Функция для фильтрации видимых сообщений
function filterVisibleResponses(responses) {
  return responses.filter((response) => response.viewed !== true);
}

mutateAllResponses()

// Обработчик команды /dialogues
bot.onText(/\/dialogues/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  let page = 1;
  let showAll = true; // Флаг для определения, отображать все или только новые сообщения

  try {
    let responses = await getAllResponses();

    if (responses.length === 0) {
      bot.sendMessage(chatId, "Нет доступных сообщений.");
      return;
    }

    if (!showAll) {
      responses = filterVisibleResponses(responses); // Фильтрация видимых сообщений
    }

    const pageSize = 1;
    let totalPages = responses.length;

    if (page < 1 || page > totalPages) {
      bot.sendMessage(chatId, "Неверный номер страницы.");
      return;
    }

    const response = responses[page - 1];

    let responseText = `Диалог ${page}/${totalPages}\n\n`;
    responseText += `Пользователь: ${
      response.username.includes("+")
        ? response.username
        : `@${response.username}`
    }\n`;
    responseText += `Сообщения: ${response.messages.join("\n")}\n\n`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: response?.viewed ? "" : "Перевести в статус: просмотрено",
            callback_data: JSON.stringify({
              command: "mark_viewed",
              page: page,
            }),
          },
        ],
        [
          {
            text: "Назад",
            callback_data: JSON.stringify({
              command: "previous",
              page: page,
            }),
          },
          {
            text: "Вперед",
            callback_data: JSON.stringify({
              command: "next",
              page: page,
            }),
          },
        ],
        [
          {
            text: showAll ? "Только новые" : "Все",
            callback_data: JSON.stringify({
              command: "visible",
              page: page,
            }),
          },
        ],
      ],
    };

    bot
      .sendMessage(chatId, responseText, { reply_markup: keyboard })
      .then((result) => {
        const messageId = result.message_id; // Идентификатор сообщения

        // Сохраняем данные пользователя
        userData[userId] = {
          messageId,
          page,
          showAll,
        };

        bot.on("callback_query", async (callbackQuery) => {
          if (callbackQuery.message.message_id !== messageId) {
            // Игнорировать callback_query для предыдущих сообщений
            return;
          }

          const data = JSON.parse(callbackQuery.data);

          if (data.command === "previous" && page > 1) {
            page -= 1;
          } else if (data.command === "next" && page < totalPages) {
            page += 1;
          } else if (data.command === "visible") {
            showAll = !showAll; // Переключение флага showAll
            responses = await getAllResponses();

            if (!showAll) {
              responses = filterVisibleResponses(responses); // Фильтрация видимых сообщений
            }

            totalPages = responses.length;
            page = 1;
          } else if (data.command === "mark_viewed") {
            console.log(responses[page - 1].username);
            await postResponse({
              username: responses[page - 1].username,
              viewed: true,
            });

            responses = await getAllResponses();

            if (!showAll) {
              responses = filterVisibleResponses(responses); // Фильтрация видимых сообщений
            }

            totalPages = responses.length;
            page = 1;
          }

          const response = responses[page - 1];

          let responseText = `Диалог ${page}/${totalPages}\n\n`;
          responseText += `Пользователь: ${
            response.username.includes("+")
              ? response.username
              : `@${response.username}`
          }\n`;
          responseText += `Сообщения: ${response.messages.join("\n")}\n\n`;

          bot.editMessageText(responseText, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: response?.viewed
                      ? ""
                      : "Перевести в статус: просмотрено",
                    callback_data: JSON.stringify({
                      command: "mark_viewed",
                      page: page,
                    }),
                  },
                ],
                [
                  {
                    text: "Назад",
                    callback_data: JSON.stringify({
                      command: "previous",
                      page: page,
                    }),
                  },
                  {
                    text: "Вперед",
                    callback_data: JSON.stringify({
                      command: "next",
                      page: page,
                    }),
                  },
                ],
                [
                  {
                    text: showAll ? "Только новые диалоги" : "Все диалоги",
                    callback_data: JSON.stringify({
                      command: "visible",
                      page: page,
                    }),
                  },
                ],
              ],
            },
          });

          // Обновляем данные пользователя
          userData[userId] = {
            messageId,
            page,
            showAll,
          };
        });
      });
  } catch (error) {
    console.log("Ошибка при получении сообщений:", error);
    bot.sendMessage(
      chatId,
      "Произошла ошибка при получении сообщений. Попробуйте позже."
    );
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;

  const widgetData = {
    name: "Название вашего бота",
    commands: [
      {
        command: "/start",
        description: "Запустить бота",
      },
      {
       command: "/dialogues",
        description: "Текстовые диалоги со всеми пользователями",
      },
    ],
  };

  bot
    .setMyCommands(widgetData.commands)
    .then(() => {
      bot.sendMessage(
        chatId,
        `Привет, ${username}! Я бот Telegram. Как могу помочь?`
      );
    })
    .catch((error) => {
      console.error("Ошибка при установке виджета быстрых команд:", error);
      bot.sendMessage(
        chatId,
        "Произошла ошибка при установке виджета быстрых команд."
      );
    });

  // Инициализируем данные пользователя
  userData[userId] = {
    messageId: null,
    page: 1,
    showAll: true,
  };
});
