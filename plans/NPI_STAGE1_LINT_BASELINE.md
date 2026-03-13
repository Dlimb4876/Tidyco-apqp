# NPI Stage 1 ESLint Log

Date: 2026-03-13 14:35:36
Command: node node_modules/eslint/bin/eslint.js <8 Stage-1 files>

Lint output:
node : (node:19752) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file
:///C:/Users/Tidyco/Documents/VScode/Tidyco-apqp/eslint.config.js?mtime=1773412
217890 is not specified and it doesn't parse as CommonJS.
At line:1 char:631
+ ... ; $output = node node_modules/eslint/bin/eslint.js $files 2>&1 | Out- ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ((node:19752) [M...se as CommonJS. 
   :String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
Reparsing as ES module because module syntax was detected. This incurs a 
performance overhead.
To eliminate this warning, add "type": "module" to 
C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\package.json.
(Use `node --trace-warnings ...` to show where the warning was created)

C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\rpn-chart.js
  5:10  warning  'renderRpnBurndown' is defined but never used  no-unused-vars

G�� 1 problem (0 errors, 1 warning)

---

Final re-check

Date: 2026-03-13 14:44:00
Command: npm run lint:npi
Result: No lint rule violations in NPI files. Only Node module-type runtime warning was emitted by ESLint loader.
