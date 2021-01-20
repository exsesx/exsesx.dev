import React from 'react';

interface HomeProps {}

export default function Home({}: HomeProps) {
  return (
    <div className="container mx-auto flex h-full justify-center items-center">
      <div className="grid grid-cols-2 gap-2 items-center">
        <img
          alt="Main Avatar"
          className="h-28 w-28 rounded-full mx-auto"
          src="https://avatars1.githubusercontent.com/u/20399517?s=460&u=7659ff2e4394643c56a6223b310f3492cd6feb1f&v=4"
        />
        <div className="text-left">
          <h2 className="text-gray-900 dark:text-gray-50 text-xl font-bold">Oleh Vanin</h2>
          <div className="text-gray-600 dark:text-gray-300 text-lg">Software Engineer</div>
          <div className="inline-flex text-gray-600 dark:text-gray-300 mt-2 space-x-2">
            <a href="https://github.com/exsesx" className="flex items-center">
              <img
                src="https://cdn.iconscout.com/icon/free/png-256/github-153-675523.png"
                alt="GitHub"
                className="h-7"
              />
            </a>
            <a href="https://www.linkedin.com/in/exsesx/">
              <img
                src="https://cdn4.iconfinder.com/data/icons/social-messaging-ui-color-shapes-2-free/128/social-linkedin-circle-512.png"
                alt="LinkedIn"
                className="h-7"
              />
            </a>
            <a href="https://t.me/exsesx" className="flex items-center">
              <img
                src="https://cdn3.iconfinder.com/data/icons/popular-services-brands-vol-2/512/telegram-512.png"
                alt="Telegram"
                className="h-7"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
