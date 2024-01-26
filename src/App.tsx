import React from "react";
import Header from "./components/Header";
import DateRangeInput from "./components/DateRange";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faYoutube,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

const App: React.FC = () => {
  return (
    <div>
      <Header />
      <div className="flex justify-center min-h-screen">
        <div className="w-full max-w-xl pt-4 px-2 sm:px-0">
          <DateRangeInput />
        </div>
      </div>
      <div className="fixed bottom-4 right-4">
        <p className="text-sm mb-2 text-black dark:text-gray-300">
          <a
            href="https://matheusmorett.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            © madmorett
          </a>
        </p>
        <div className="flex space-x-2">
          <a
            href="https://twitter.com/Morett_the_best"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faXTwitter} className="h-6 w-6 text-black" />
          </a>
          <a
            href="https://instagram.com/madmorett"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon
              icon={faInstagram}
              className="h-6 w-6 text-pink-500"
            />
          </a>
          <a
            href="https://www.youtube.com/channel/UCbDnkQGDPvCEnXLMm5oFz5g"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon
              icon={faYoutube}
              className="h-6 w-6 text-red-600"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
