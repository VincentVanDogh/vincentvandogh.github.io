<script>
	import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";

  export let name;
  export let language;

  function switchLanguage(newLanguage) {
    language = newLanguage;
  }
</script>

<Header></Header>
<main>
	<h1>{name}</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
  <article>
    <div id="about-me">
    {#if language === 'english'}
      <h2>About me</h2>
      <p>
        I was born on 28.11.1997 in Bratislava. I lived a few years in Nairobi, Kenya. Then I left for Dubai, UAE.
        After a lengthy spell in abroad, i alas returned to Slovakia, which though ever did not last long, as I then
        ended up moving again to Strassbourg, France. Long story short, lots of moving.
      </p>
      <p>I then decided to study informatics at the University of Technology, Vienna.</p>
      <p>I collected job experience at Bosch as a Java Software Engineer.</p>
    {:else if language === 'german'}
      <h2>Über mir</h2>
      <p>
       Ich bin am 28.11.1997 in Bratislava geboren worden. Ich wohnte einige Jahre in Nairobi, Kenia. Dann habe ich das
        Land für Dubai, UAE verlassen. Nach einer langen Zeit im Ausland, kehrte ich schließlich wieder zurück, wo ich
        mich allerdings nicht zu lange aufenthielt, da ich wieder ausgereist bin, diesmal nach Straßburg in Frankreich.
        Lange Rede, kurzer Sinn, ich habe im Leben viel herumgereist.
      </p>
      <p>Daraufhin habe ich mich entschieden an der Technischen Universität Wien zu studieren.</p>
      <p>Ich sammelte Praxiserfahrung bei Bosch als Java Entwickler.</p>
    {/if}
    </div>
    <img src="resources/united-kingdom-flag-icon.png" alt="United Kingdom flag" class="flag-icon" on:click={() => switchLanguage('english')}/>
    <img src="resources/germany-flag-icon.png" alt="German flag" class="flag-icon" on:click={() => switchLanguage('german')}/>
  </article>
</main>
<Footer></Footer>

<style>
  body {
    background: var(--bg-dark);
  }

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

  button {
      cursor: pointer;
  }

  #about-me {
      text-align: left;
  }

  .flag-icon {
      cursor: pointer;
      width: 42px;
  }

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
