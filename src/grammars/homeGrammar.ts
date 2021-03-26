export const grammar = `

<grammar root="main">
   <rule id="main">
      <ruleref uri="#request"/>
      <tag>out.request = new Object(); out.request.object=rules.request.appliance; out.request.action=rules.request.directive;</tag>
   </rule>

    <rule id="request">
        <item repeat="0-1"> please </item>
            <one-of> 
                <item>
                    <ruleref uri="#action1"/>
                    <tag>out.directive=rules.action1;</tag>
                    the
                    <ruleref uri="#object1"/>
                    <tag>out.appliance=rules.object1;</tag>
                </item>
                <item>
                    turn the
                    <ruleref uri="#object2"/>
                    <tag>out.appliance=rules.object2;</tag> 
                    <ruleref uri="#action2"/>
                    <tag>out.directive=rules.action2;</tag>
                </item> 
                <item>
                    turn
                    <ruleref uri="#action2"/>
                    <tag>out.directive=rules.action2;</tag>
                    the
                    <ruleref uri="#object2"/>
                    <tag>out.appliance=rules.object2;</tag>
                </item>
            </one-of> 
    </rule>

   <rule id="object1">
      <one-of>      
         <item> window </item>
         <item> door </item>
      </one-of>
   </rule>
   <rule id="action1">
      <one-of>
         <item> close </item>
         <item> open </item>
      </one-of>
   </rule>
   <rule id="object2">
      <one-of>
         <item> light </item>
         <item> lights </item>
         <item> heat </item>
         <item> A C <tag> out = 'air conditioning';</tag></item>
         <item> AC <tag> out = 'air conditioning';</tag></item>
         <item> air conditioning </item>
      </one-of>
   </rule>
   <rule id="action2">
      <one-of>
         <item> off <tag> out = 'turn off';</tag></item>
         <item> on <tag> out = 'turn on';</tag></item>
      </one-of>
   </rule>

</grammar>
`
