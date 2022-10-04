<script>
  import TickerCardChart from "./TickerCardChart.svelte";
  import { selected_symbols, favorite_symbols } from "../stores.js";

  export let ticker;
  let symbol, data;

  let prices_data, vols_data;
  let stock_return, text_color;

  const add = (symbol, store) => store.update((lst) => [...lst, symbol]);
  const remove = (symbol, store) =>
    store.update((lst) => lst.filter((item) => item !== symbol));

  function generate_data({ times, prices, vols }) {
    function xypairs(arr1, arr2) {
      if (!arr1 === arr2) {
        throw new Error(message || "Array sizes not equal");
      }
      const pair = [];
      for (let i = 0; i < arr1.length; ++i) {
        pair.push({ x: arr1[i], y: arr2[i] });
      }
      return pair;
    }
    return [xypairs(times, prices), xypairs(times, vols)];
  }

  const round_to_two = num => num.toFixed(2);
  const profitloss = (prices) => (prices.at(-1) - prices.at(0)) / prices.at(0);

  $: {
    [symbol, data] = ticker;
    [prices_data, vols_data] = generate_data(data); // vols_data not used for anything

    stock_return = 100 * profitloss(data.prices);
    text_color = stock_return > 0 ? "text-emerald-600" : "text-rose-700";
  }
</script>

<div class="flex place-items-center rounded-lg my-2 hover:bg-base-200">
  {#if !$selected_symbols.includes(symbol)}
    <button
      class="basis-1/12 self-stretch mx-2"
      on:click={() => add(symbol, selected_symbols)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  {:else}
    <button
      class="basis-1/12 self-stretch mx-2"
      on:click={() => remove(symbol, selected_symbols)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  {/if}
  <p class="basis-2/12 text-center 2xl:text-xl">{symbol}</p>
  <div class="basis-2/12 flex flex-col">
    <p class="text-center">${data.prices.at(-1)}</p>
    <p class="text-center text-xs">Vol {round_to_two(data.vols.at(-2))}K</p>
  </div>
  <div class="basis-4/12 w-1 h-20 p-2">
    <TickerCardChart chart_data={prices_data} />
  </div>
  <p
    class="basis-2/12 text-center text-sm 2xl:text-base font-bold {text_color}"
  >
    {round_to_two(stock_return)}%
  </p>
  {#if !$favorite_symbols.includes(symbol)}
    <button
      class="basis-1/12 self-stretch mx-2"
      on:click={() => add(symbol, favorite_symbols)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    </button>
  {:else}
    <button
      class="basis-1/12 self-stretch mx-2"
      on:click={() => remove(symbol, favorite_symbols)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    </button>
  {/if}
</div>
