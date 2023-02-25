<script>
  import { onMount } from 'svelte';
  import SveltyPicker from "svelty-picker";
  import RangeSlider from "svelte-range-slider-pips";
  import TickerChart from "./TickerChart/TickerChart.svelte";
  import TickerCard from "./TickerCard/TickerCard.svelte";
  import { Moon } from 'svelte-loading-spinners';
  import { selected_symbols, favorite_symbols } from "./stores.js";

  let search_bar = "";
  let data = {
    '' : {
        times : [0, 0],
        prices : [0, 0],
        vols : [0, 0],
    },
  };

  // Fetching
  let fetching_data = false;
  let fetch_error = false;

  // Dates
  // Returns date as yyyy-mm-dd hh:MM:ss string
  const date_string = date => new Date(date.toString().split('GMT')[0]+' UTC').toISOString().split('.')[0].replace("T", " ");

  const start_ago = new Date();
  start_ago.setDate(start_ago.getDate() - 5);
  const end_ago = new Date();
  end_ago.setDate(end_ago.getDate() - 4);
  
  let start_date = "2023-02-23 23:59";
  let end_date = "2023-02-24 23:59";

  // Sliders
  let minprice, maxprice, minvol, maxvol;
  let [price_slider, vol_slider] = [[0, 0], [0, 0]];

  // Favorites
  let show_favorites = false;

  // Fetches data based on stat_date and end_date using the api
  async function fetch_data() {
    const to_utc = date => Date.parse(new Date(date.replace(" ", "T")).toISOString());
    fetching_data = true;
    fetch_error = false;
		await fetch(`/api/stock-data/${to_utc(start_date)}to${to_utc(end_date)}`).then(returnResponse => {
      returnResponse.json().then(stock_data => {
        data = stock_data;
      }).catch((error) => {
        console.warn(error)
        fetch_error = true;
        alert("The data you requested exceeded Vercel's (hosting company) size/time limits.\nTry again with a smaller range of time.")
      });
    }).catch((error) => {
      console.log('Server Error', error)
    });
    fetching_data = false;
  }

  // Returns true if a ticker should be displayed on the RHS
  function display(
    [symbol, data],
    search_bar,
    price_slider,
    vol_slider,
    show_favorites
  ) {
    let in_search_bar, between_prices, between_vols;

    if (search_bar.startsWith('\"') && search_bar.endsWith('\"')) {
      in_search_bar = symbol === search_bar.slice(1, -1).toUpperCase();
    } else {
      in_search_bar = symbol.includes(search_bar.toUpperCase());
    }

    if (!search_bar.startsWith('!')) {
      between_prices = data.prices.at(-2) <= price_slider.at(1) && price_slider.at(0) <= data.prices.at(-1);
      between_vols = data.vols.at(-2) <= vol_slider.at(1) && vol_slider.at(0) <= data.vols.at(-2);
    } else {
      in_search_bar = symbol.includes(search_bar.slice(1).toUpperCase());
      [between_prices, between_vols] = [true, true]
    }
    
    const in_favorites = $favorite_symbols.includes(symbol);

    return (
      in_search_bar &&
      between_prices &&
      between_vols &&
      (show_favorites ? in_favorites : true)
    );
  }

  // If data changes update min/max range of prices and vols
  function update_minmax(data) {
    const minmax = (arr) => [Math.min(...arr), Math.max(...arr)];
    const last_prices = Object.values(data).map((ticker) =>
      ticker.prices.at(-1)
    );
    const last_vols = Object.values(data).map((ticker) => ticker.vols.at(-2));
    return [minmax(last_prices), minmax(last_vols)];
  }

  // Load past week's data by default
  onMount(async () => {
	  await fetch_data();
	});

  // Update min/max if data changes
  $: [[minprice, maxprice], [minvol, maxvol]] = update_minmax(data);
  // Update sliders  to min/max of data
  $: [price_slider, vol_slider] = [[minprice, maxprice], [minvol, maxvol]];
</script>

<div class="w-screen h-screen flex flex-col">
  <div class="flex items-end justify-between mx-2 mb-2">
    <div class="basis-1/6 flex items-center self-stretch mx-2" on:click={() => selected_symbols.set([])}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <article class="prose ds-prose prose-sm ml-2">
        <h1>Stock Search</h1>
      </article>
    </div>
    <div class="basis-5/6 shrink flex items-end justify-end">
      <div class="basis-2/4 ds-form-control mx-4">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="ds-label">
          <span class="ds-label-text text-xs">Start date</span>
          <span class="ds-label-text text-xs">End date</span>
        </label>
        <label class="ds-input-group">
          <SveltyPicker
            inputClasses="w-1/2 ds-form-control ds-input ds-input-bordered"
            theme="my-theme"
            startDate="2022-04-01 00:00"
            endDate={end_date}
            todayBtn={false}
            clearBtn={false}
            format="yyyy-mm-dd hh:ii"
            bind:value={start_date}
          />
          <button class="ds-btn ds-btn-square no-animation">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
          <SveltyPicker
            inputClasses="w-1/2 ds-form-control ds-input ds-input-bordered"
            theme="my-theme"
            startDate="2022-04-01 00:00"
            endDate="2023-02-24 23:59"
            todayBtn={false}
            clearBtn={false}
            format="yyyy-mm-dd hh:ii"
            bind:value={end_date}
          />
        </label>
      </div>
      <button class="basis-1/8 ds-btn ds-btn-square mr-6" on:click={fetch_data}>
        {#if fetch_error}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 stroke-red-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        {:else if !fetching_data}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985
              19.644v-4.992m0 0h4.992m-4.993 
              0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 
              9.865a8.25 8.25 0 0113.803-3.7l3.181 
              3.182m0-4.991v4.99" 
            />
          </svg>
        {:else}
          <Moon color="hsl(var(--nc))" size="24" unit="px"/>
        {/if}
      </button>
      <div class="basis-1/6 self-center flex-col mx-4">
        <p class="text-center">Price</p>
        <RangeSlider
          range
          float
          prefix="$"
          step={10}
          min={minprice}
          max={maxprice}
          bind:values={price_slider}
          springValues={{stiffness: 1, damping: 1}}
        />
      </div>
      <div class="basis-1/6 self-center flex-col mr-2">
        <p class="text-center">Volume (K)</p>
        <RangeSlider
          range
          float
          suffix=""
          step={500}
          min={minvol}
          max={maxvol}
          bind:values={vol_slider}
          springValues={{stiffness: 1, damping: 1}}
        />
      </div>
    </div>
  </div>
  <div class="grow overflow-y-auto flex flex-row">
    <div class="grow w-1 overflow-y-auto rounded-3xl border-4 border-base-300 m-4 p-6">
      {#if !$selected_symbols.length}
        <div class="flex flex-col justify-center">
          <div class="ds-carousel w-full">
            <div id="item1" class="ds-carousel-item w-full justify-center">
              <article class="min-w-[80%] prose ds-prose xl:prose-lg">
                <h2 class="text-center">Motivation</h2>
                <p class="text-justify">
                  Throughout college I only had a bit of exposure to web development.
                  Given how versatile of a field it is, I decided to teach myself by building a stock backtesting website.
                  After learning about the different JS frameworks, I decided to build the website with
                  <a href="https://svelte.dev">Svelte</a> & <a href="https://kit.svelte.dev">Svelte Kit</a>,
                  due to their intuitiveness. The UI was constructed using a mix of
                  <a href="https://tailwindcss.com">Tailwind CSS</a> and <a href="https://daisyui.com">DaisyUI</a> as well as
                  the following elements <a href="https://mskocik.github.io/svelty-picker/?ref=madewithsvelte.com">Svelty Picker</a>,
                  <a href="https://github.com/simeydotme/svelte-range-slider-pips">Range Sliders</a>,
                  and <a href="https://github.com/Schum123/svelte-loading-spinners">Loading Spinners</a>.
                  In order to display the ticker data, I learned how to use <a href="https://www.chartjs.org">Chart.js</a>.
                  Due to the large amount of data, the ticker data is stored on the cloud using 
                  <a href="https://www.mongodb.com/home">MongoDB</a>.
                  When loading stock data, the frontend makes an API fetch request to the backend with the start
                  and end dates selected by the user.
                  The backend then fetches the corresponding data from the MongoDB database.
                  Users also have the option to test out their own trading algos by using the 'Backtest' tab.
                </p>
              </article>
            </div>
            <div id="item2" class="ds-carousel-item w-full justify-center">
              <article class="min-w-[80%] prose ds-prose xl:prose-lg">
                <h2 class="text-center">Tutorial</h2>
                <ol>
                  <li>
                    Select a start and end date using the calendar widget at the top
                  </li>
                  <li>
                    Press the refresh button to load the data from the server
                  </li>
                  <li>
                    On the right you will see all available companies (450+) and their data
                  </li>
                  <li>
                    You can press on a company's name to plot it and use the plus sign to compare it with other companies
                  </li>
                  <li>
                    While plotting a company's prices, at the bottom right, the backtest tab allows you to test your own trading strategies on your selected symbols
                  </li>
                  <li>
                    You can search for specific companies using the search bar or the price and volume sliders at the top
                  </li>
                  <li>
                    If there's a company you like, add it to your favorites by pressing on the star; you can view your favorites with the toggle
                  </li>
                </ol>
              </article>
            </div>
          </div> 
          <div class="flex justify-center w-full py-2 gap-2">
            <a href="#item1" class="ds-btn ds-btn-xs">Motivation</a> 
            <a href="#item2" class="ds-btn ds-btn-xs">Tutorial</a> 
          </div>
          <!-- <article class="min-w-[95%] prose ds-prose xl:prose-lg">
            <h4 class="text-center">Motivation</h4>
            <p class="text-justify">
              Last semester, in my Intro to Finance class, I learned about portoflio optimization and common trading biases.
              I thought about how all of this information could help people avoid losing money when investing.
              At the time I also wanted to learn web dev. Alas, this project was born.
              So far I have created a functional ticker search website.
              My next goal is to add a portoflio optimization widget based on a user's favorited symbols.
              The ultimate goal is to create a hub for retail investors where people can learn about various investments classes,
              investment strategies, and dangerous behavioral biases to watch out for.
            </p>
            <h4 class="text-center">Tutorial</h4>
            <ol>
              <li>
                Select a start and end date using the calendar widget at the top
              </li>
              <li>
                Press the refresh button to load the data from the server
              </li>
              <li>
                On the right you will see all available companies (450+) and their data
              </li>
              <li>
                You can press on a company's name to plot it and use the plus sign to compare it with other companies
              </li>
              <li>
                You can search for specific companies using the search bar or the price and volume sliders at the top
              </li>
              <li>
                If there's a company you like, add it to your favorites by pressing on the star
              </li>
            </ol>
          </article> -->
        </div>
      {:else}
        <TickerChart
          chart_data={Object.fromEntries(
            $selected_symbols.map((symbol) => [symbol, data[symbol]])
          )}
        />
      {/if}
    </div>
    <!-- Scroll wrapper -->
    <div
      class="w-[35%] min-w-[27rem] max-w-[35rem] rounded-3xl border-4 border-base-300 m-4 p-5 flex flex-col"
    >
      <!-- Sidebar -->
      <div class="flex mb-4">
        <div class="grow flex mr-6">
          <div class="ds-input-group mr-2">
            <input
              type="text"
              placeholder="Search…"
              class="w-3/4 ds-input ds-input-sm 2xl:ds-input-md ds-input-bordered"
              bind:value={search_bar}
            />
            <button class="w-1/4 ds-btn ds-btn-sm 2xl:ds-btn-md ds-btn-square">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 2xl:h-7 2xl:w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                /></svg
              >
            </button>
          </div>
          <button
            data-tip='(1) Use ! to disregard filters (2) Use " " for exact search'
            class="ds-tooltip ds-tooltip-bottom before:content-[attr(data-tip)] before:max-w-[13rem]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              /></svg
            >
          </button>
        </div>
        <div class="flex items-center">
          <p class="mr-2">Favorites</p>
          <input
            type="checkbox"
            class="ds-toggle"
            bind:checked={show_favorites}
          />
        </div>
      </div>
      <div class="grow overflow-y-auto flex flex-col">
        {#each Object.entries(data) as ticker}
          <div
            class={display(
              ticker,
              search_bar,
              price_slider,
              vol_slider,
              show_favorites
            )
              ? ""
              : "hidden"}
          >
            <TickerCard {ticker} />
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  :global(.my-theme) {
      --sdt-primary: hsl(var(--bc));
      --sdt-color: hsl(var(--bc));
      --sdt-bg-main: hsl(var(--b1));
      --sdt-btn-bg-hover: hsl(var(--b3));
      --sdt-btn-header-bg-hover: hsl(var(--b3));
      --sdt-clock-bg: hsl(var(--b3));
      --sdt-shadow: rgb(93, 93, 93);
      --sdt-disabled-date: hsl(var(--er));
  }
</style>
