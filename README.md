<p align="center">
  <img style="max-width: 100%;" alt="Welcome to Stream-Query-Client" src="images/projectLogo.png"/>
</p>

# Stream-Query-Client

Stream-Query-Client is the easiest way to use Vectara's streaming query API. Simply provide a query configuration and a callback to instantly receive stream updates.

> [!TIP]
>
> Looking for something else? Try another open-source project:
>
> - **[React-Search](https://github.com/vectara/react-search)**: Add Vectara semantic search to your React apps with a few lines of code.
> - **[React-Chatbot](https://github.com/vectara/react-chatbot)**: Add a compact Vectara-powered chatbot widget chat to your React apps.
> - **[Create-UI](https://github.com/vectara/create-ui)**: The fastest way to generate a working React codebase for a range of generative and semantic search UIs.
> - **[Vectara Answer](https://github.com/vectara/vectara-answer)**: Demo app for Summarized Semantic Search with advanced configuration options.
> - **[Vectara Ingest](https://github.com/vectara/vectara-ingest)**: Sample templates and crawlers for pulling data from many popular data sources.

## How it works

When executed, `streamQuery` sends a request to Vectara's streaming query API. As the endpoint returns data chunks to the browser, the supplied `onStreamUpdate` is executed with relevant data from the most recent chunk. You can then use this latest data in your application however you wish.

## Use it in your application

### Install Stream-Query-Client

```shell
npm install --save @vectara/stream-query-client
```

Then use it in your application like this:

```js
import {
  streamQuery,
  StreamUpdate,
  StreamQueryConfig,
} from "@vectara/stream-query-client";

/* snip */

const sendQuery = async () => {
  const configurationOptions: StreamQueryConfig = {
    // configuration properties
  };

  const onStreamUpdate = (update: StreamUpdate) => {
    // perform operations on returned data, e.g. update state
  };

  streamQuery(configurationOptions, onStreamUpdate);
};
```

For more information on configuration options and callback types, see [the type definitions](src/types.ts) and our [Query API documentation](https://docs.vectara.com/docs/api-reference/search-apis/search).

## License

Create-UI is an open-sourced software licensed under the [Apache 2.0 license](/LICENSE).

_This repository contains sample code that can help you build UIs powered by Vectara, and is licensed under the Apache 2.0 License. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License._
