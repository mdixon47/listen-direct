<script setup lang="ts">
useHead({
  title: 'Terms of Use · Listen Direct',
  meta: [{ name: 'description', content: 'Terms governing use of the Listen Direct product demonstration.' }],
})
</script>

<template>
  <main class="legal-page">
    <nav><NuxtLink class="legal-brand" to="/"><span><i /><i /><i /></span>LISTEN<strong>/DIRECT</strong></NuxtLink><div><NuxtLink to="/privacy">Privacy Policy</NuxtLink><NuxtLink to="/help">Help Center</NuxtLink><NuxtLink to="/login">Sign in</NuxtLink></div></nav>
    <header><span>LEGAL / TERMS</span><h1>Terms of Use</h1><p>Effective August 19, 2026 · Demo version 1.0</p></header>
    <div class="legal-layout">
      <aside><a href="#agreement">Agreement</a><a href="#demo">Demo service</a><a href="#accounts">Accounts</a><a href="#acceptable">Acceptable use</a><a href="#voice">Voice and AI</a><a href="#ownership">Ownership</a><a href="#services">Third parties</a><a href="#warranty">Disclaimers</a><a href="#liability">Liability</a><a href="#ending">Termination</a></aside>
      <article>
        <div class="legal-notice"><strong>Demo terms</strong><p>These terms are a structured starting point for the prototype and require qualified legal review, operator details, governing law, and commercial terms before production use.</p></div>
        <section id="agreement"><span>01</span><h2>Agreement to these terms</h2><p>By accessing or using Listen Direct, you agree to these Terms of Use and acknowledge the Privacy Policy. If you use the service for an organization, you represent that you have authority to accept these terms on its behalf. Do not use the service if you do not agree.</p></section>
        <section id="demo"><span>02</span><h2>Nature of the demo service</h2><p>Listen Direct currently demonstrates a proposed voice-AI operations product. Waveforms, voice turns, model results, metrics, transcripts, and policy outcomes may be simulated. The demo is not a production communications, emergency, medical, financial, employment, legal, or safety system.</p></section>
        <section id="accounts"><span>03</span><h2>Accounts and access levels</h2><p>Demo, user, and administrator identities receive different permissions. You must provide accurate registration information, keep credentials secure, use only accounts you are authorized to access, and notify the operator of suspected compromise.</p><p>Administrators are responsible for the identities, permissions, retention settings, and integrations they configure for their organization.</p></section>
        <section id="acceptable"><span>04</span><h2>Acceptable use</h2><p>You may not use the service to:</p><ul><li>Break laws, infringe rights, or deceive, threaten, harass, or harm others.</li><li>Record or process a person’s voice without required notice, consent, or authority.</li><li>Infer protected or highly sensitive traits without a lawful, documented, and appropriate purpose.</li><li>Attempt unauthorized access, bypass role controls, probe vulnerabilities without permission, or disrupt the service.</li><li>Upload malware, automate abusive traffic, or use outputs to make prohibited high-impact decisions.</li><li>Present simulated results as verified production evidence.</li></ul></section>
        <section id="voice"><span>05</span><h2>Voice data and AI outputs</h2><p>You are responsible for having the rights and permissions needed for audio you submit. AI outputs can be incomplete, inaccurate, biased, or inappropriate and must be reviewed for the intended use. Do not rely on the service as the sole basis for consequential decisions about a person.</p><p>Production integrations may be subject to separate model-provider terms, usage rules, geographic restrictions, and data-processing agreements.</p></section>
        <section id="ownership"><span>06</span><h2>Ownership and feedback</h2><p>The operator and its licensors retain their rights in the application, branding, software, documentation, and service design. Users retain rights they hold in submitted content. A production agreement should specify licenses needed to process inputs and deliver outputs.</p><p>Feedback may be used to improve the product without obligation, provided it does not include confidential information or personal data that the operator is not authorized to process.</p></section>
        <section id="services"><span>07</span><h2>Third-party services</h2><p>Supabase provides authentication and database services. Hosting, analytics, speech, AI-model, billing, and monitoring providers may have separate terms and privacy practices. The current repository does not connect live audio or analytics providers. Any deployment must identify its actual vendors before launch.</p></section>
        <section id="warranty"><span>08</span><h2>Availability and disclaimers</h2><p>The prototype is provided for evaluation on an “as is” and “as available” basis. Features may change, fail, or be removed. To the extent permitted by law, the operator disclaims implied warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, and uninterrupted availability.</p></section>
        <section id="liability"><span>09</span><h2>Limitation of liability</h2><p>A production version must include limitations appropriate to the operator, customers, pricing, insurance, and governing law. Nothing in these terms excludes liability that cannot legally be excluded. Until those terms are supplied, do not use this prototype for production or consequential activity.</p></section>
        <section id="ending"><span>10</span><h2>Suspension, termination, and governing terms</h2><p>Access may be suspended for security risks, misuse, legal requirements, or material breach. Users may stop using the demo at any time and clear their session by signing out.</p><p>Before production, the deploying entity must add its legal identity, governing law, venue, dispute process, contact method, notice procedure, and any order-form or subscription terms. Changes should be communicated with an updated effective date.</p></section>
      </article>
    </div>
    <footer><span>Listen Direct · Terms version 1.0</span><NuxtLink to="/help">Help Center</NuxtLink><NuxtLink to="/privacy">Read Privacy Policy →</NuxtLink></footer>
  </main>
</template>

<style scoped src="~/assets/legal.css"></style>
