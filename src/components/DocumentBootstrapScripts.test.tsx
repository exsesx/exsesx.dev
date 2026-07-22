import { describe, expect, test } from "bun:test";
import { createServerInsertedHTML } from "next/dist/server/app-render/server-inserted-html";
import { renderToStaticMarkup } from "react-dom/server";
import DocumentBootstrapScripts from "./DocumentBootstrapScripts";

describe("DocumentBootstrapScripts", () => {
  test("emits each bootstrap once across repeated stream flushes", () => {
    const { renderServerInsertedHTML, ServerInsertedHTMLProvider } = createServerInsertedHTML();

    renderToStaticMarkup(
      <ServerInsertedHTMLProvider>
        <DocumentBootstrapScripts />
      </ServerInsertedHTMLProvider>,
    );

    const firstFlush = renderToStaticMarkup(<>{renderServerInsertedHTML()}</>);
    const secondFlush = renderToStaticMarkup(<>{renderServerInsertedHTML()}</>);

    expect(firstFlush.match(/id="noflash"/g)).toHaveLength(1);
    expect(firstFlush.match(/id="blog-focus-bootstrap"/g)).toHaveLength(1);
    expect(secondFlush).toBe("");
  });
});
