<script lang="ts">
  export let data

  let clientGreeting = ""

  import { decrementCount, greet, reset } from "$lib/tele/test.telephone";
  import { add, multiply } from "$lib/tele/test2.telephone";

  let result = 0
</script>

<p>{JSON.stringify(data)}</p>
<button on:click={async () => {clientGreeting = await greet("tele")}}>Test</button>
<button on:click={async () => {clientGreeting = "After decrement: " + await decrementCount({by: 10})}}>Decrement</button>
<button on:click={async () => {await reset()}}>Reset</button>
<p>{clientGreeting}</p>
<button on:click={async () => {result = await add(5)}}>Add 5</button>
<button on:click={async () => {result = await multiply(3)}}>Mul 3</button>
<p>{result}</p>