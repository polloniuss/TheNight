export const grammar = `
<grammar root="quotes">
   <rule id="quotes">
      <ruleref uri="#quote"/>
      <tag>out.quote = new Object(); out.quote.by=rules.quote.from;</tag>
   </rule>
   <rule id="quote">
      <ruleref uri="#sentences"/>
      <tag>out.from=rules.sentences;</tag>
   </rule>
   <rule id="sentences">
      <one-of>
         <item>to do is to be<tag>out="Socrates";</tag></item>
         <item>to be is to do<tag>out="Sartre";</tag></item>
         <item>do be do be do<tag>out="Sinatra";</tag></item>
         <item>mushrooms</item>
      </one-of>
   </rule>
</grammar>
`
