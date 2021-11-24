export default function fetcher(input: RequestInfo, init?: RequestInit): Promise<any> {
  return fetch(input, init).then(res => res.json());
}
