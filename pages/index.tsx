import { getCookie } from 'cookies-next';
import { NextPageContext } from 'next';
import Head from 'next/head';
import { useCallback, useState } from 'react';

import { Header } from '@/components/Header';
import { Message, MessageProps, SystemMessage } from '@/components/Message';
import { TextareaForm } from '@/components/TextareaForm';
import { fetchChat } from '@/utils/api';
import { exampleChatMessage, exampleChatMessage2 } from '@/utils/exampleChatMessage';
import { scrollToBottom } from '@/utils/scrollToBottom';
import { sleep } from '@/utils/sleep';

const SYSTEM_MESSAGE = `本页面会将数据发送给 OpenAI
请注意隐私风险，禁止发送违法内容`;
const WELCOME_MESSAGE = '你好，有什么需要帮助的吗？';
const LOADING_MESSAGE = '正在努力思考...';

interface HomeProps {
  OPENAI_API_KEY?: string;
}

export default function Home({ OPENAI_API_KEY }: HomeProps) {
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([]);

  /** 提交回调 */
  const onSubmit = useCallback(
    async (text: string) => {
      let newMessages: MessageProps[] = [];
      newMessages.push({ align: 'right', chatMessage: { text } });
      setMessages([...messages, ...newMessages]);
      setChatLoading(true);
      await sleep(16);
      scrollToBottom();
      try {
        const parentMessageId = messages[messages.length]?.chatMessage?.id;
        const chatRes = await fetchChat({ text, parentMessageId });
        newMessages.push({ avatar: 'ChatGPT', chatMessage: chatRes });
        setChatLoading(false);
        setMessages([...messages, ...newMessages]);
        await sleep(16);
        scrollToBottom();
      } catch (e: any) {
        setChatLoading(false);
        newMessages.push({ avatar: 'ChatGPT', error: e });
        setMessages([...messages, ...newMessages]);
        await sleep(16);
        scrollToBottom();
      }
    },
    [messages],
  );

  return (
    <>
      <Head>
        <title>ChatGPT</title>
        <meta name="description" content="A Personal ChatGPT Client" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/chatgpt-green-icon.png" />
      </Head>
      <main>
        <Header OPENAI_API_KEY={OPENAI_API_KEY} />
        <div
          style={{
            display: 'flow-root',
          }}
          className="pt-1"
        >
          <SystemMessage text={SYSTEM_MESSAGE} />
          {/* <SystemMessage text="Tips: [Shift+回车]换行" /> */}
          <Message avatar="ChatGPT" chatMessage={{ text: WELCOME_MESSAGE }} />
          <Message align="right" chatMessage={exampleChatMessage2} />
          <Message avatar="ChatGPT" chatMessage={exampleChatMessage} />
          <Message align="right" chatMessage={exampleChatMessage2} />
          <Message avatar="ChatGPT" chatMessage={exampleChatMessage} />
          {messages.map((messageProps, index) => (
            <Message key={index} {...messageProps} />
          ))}
          {chatLoading && <Message avatar="ChatGPT" chatMessage={{ text: LOADING_MESSAGE }} />}
        </div>
        <TextareaForm onSubmit={onSubmit} />
      </main>
    </>
  );
}

// This gets called on every request
export async function getServerSideProps(ctx: NextPageContext) {
  const OPENAI_API_KEY = getCookie('OPENAI_API_KEY', ctx);

  return {
    props: OPENAI_API_KEY ? { OPENAI_API_KEY } : {},
  };
}
