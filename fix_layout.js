const fs = require('fs');
let content = fs.readFileSync('artifacts/mobile/app/(tabs)/_layout.tsx', 'utf8');

content = content.replace(
  /<NativeTabs>/,
  `<NativeTabs>
      <NativeTabs.Trigger name="body">
        <Icon sf={{ default: "figure.walk", selected: "figure.walk" }} />
        <Label>Body</Label>
      </NativeTabs.Trigger>`
);

content = content.replace(
  /<Tabs\.Screen\s*name="history"/,
  `<Tabs.Screen
        name="body"
        options={{
          title: "Body",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="figure.walk" tintColor={color} size={22} />
            ) : (
              <Ionicons name="body-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="history"`
);

fs.writeFileSync('artifacts/mobile/app/(tabs)/_layout.tsx', content);
