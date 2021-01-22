import React from 'react';
import mainImage from '../static/main-image.png';

interface HomeProps {}

export default function Home({}: HomeProps) {
  return (
    <main className="container mx-auto flex h-full justify-center items-center">
      <div className="grid grid-cols-1 gap-2 justify-center items-center">
        <img alt="Main Avatar" className="h-80 w-auto object-cover mx-auto mb-4" src={mainImage} />
        <div className="text-center">
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
    </main>
  );
}
