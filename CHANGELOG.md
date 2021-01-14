# Admin Change Log #

<a name="1.5.4"></a>
# 1.5.4

- Increased coupon product limit from 25 to 50

<a name="1.5.3"></a>
# 1.5.3

- Add support to forbid customer subscription upgrades
- Bug fix in displaying errors with extended fields in gateway configuration

<a name="1.5.2"></a>
# 1.5.2

- Add support for inventory controls on products
- Add support for product exclusions on coupons

<a name="1.5.1"></a>
# 1.5.1

- Add support for subscription cancellation and pre-bill email notifications
- Add message to point to storefront from apps
- Update link to Online Storefront on Getting Started page

<a name="1.5.0"></a>
# 1.5.0

- Add support for adding up sell promotions
- Allow filtering lists of promotions by promotion type
- Refactor UI of app installations
- Minor bug fixes

<a name="1.4.5"></a>
# 1.4.5

- Add support for expand in license requests
- Add support for preferred hostname for apps under app settings
- Add support to indicate if customers are allowed to self-cancel subscriptions
- Bug fix editing subscription items after a subscription cancellation has been scheduled
- Other small bug fixes and typo corrections

<a name="1.4.4"></a>
# 1.4.4

- Add support for event notification test templates

<a name="1.4.3"></a>
# 1.4.3

- Add support for subscription changes

<a name="1.4.2"></a>
# 1.4.2

- Bug fix showing items tab by default for refund and captures
- Add option to allow public access to test orders

<a name="1.4.1"></a>
# 1.4.1

- Allow an account owner to designate other users as account owners and undelegate self
- Preparations to allow for custom hostnames
- Remove dependency on CORS for API calls to increase performance
- Create admin-kit.js which allows common admin tools to be ported into other admin apps

<a name="1.4.0"></a>
# 1.4.0

- Add support to create and edit cross-sells as a promotion
- Add support to configure refund notifications to customers
- Add AVS and CVV results to payment details page
- Add option to view / edit account signin alias
- Allow admin to choose to ingore bad AVS results when processing a payment in the virtual terminal
- See which app processed a payment


- Add meta data display for customers, payments
- Bug fix in invoice datepicker

<a name="1.3.7"></a>
# 1.3.7

- Add meta data display for customers, payments
- Bug fix in invoice datepicker

<a name="1.3.6"></a>
# 1.3.6

- Changes to reference href locations by relative rather than absolute references

<a name="1.3.5"></a>
# 1.3.5

- Add support for viewing and downloading app packages
- Add multi-language support
- Add support for wildcard shipping countries
- Upgrade to latest version of Angular UI for Bootstrap
- Add support for payment notifications
- Add virtual terminal UI

<a name="1.3.4"></a>
# 1.3.4

- Multiple small UI fixes and typo corrections
- Added UI support for stored PayPal and Amazon Pay payment methods

<a name="1.3.3"></a>
# 1.3.3

- Add support for multi-item subscriptions
- Add support for to add BCC to customer notifications
- Open the main navigation menu to the correct section when linking into a related section

<a name="1.3.2"></a>
# 1.3.2

- Add the ability to view, edit and add shipping methods (Store> Shipping Methods)

<a name="1.3.1"></a>
# 1.3.1

- Add the ability to view, edit and add promotions (Store> Promotions)
- Add the ability to view, edit and add pricing settings (Settings> Pricing)
- Add the ability to manually trigger or retry license requests and view debug details for failed requests

<a name="1.3.0"></a>
# 1.3.0

- Add the ability to view, edit and add hosted functions.
- Add the ability to view license requests.
- Add the ability to view, edit and add notification subscriptions.
- Refactor UI to view subscription, download and license details for order items.

<a name="1.2.3"></a>
# 1.2.3

- Add the ability to view, edit and delete shipments.
- Minor bug fixes.

<a name="1.2.2"></a>
# 1.2.2

- Added the option to upload files by URL, including optional HTTP authorization details.

<a name="1.2.1"></a>
# 1.2.1

- Added option to create protected, expiring download link for files (without the requiremnt for an associated order).

<a name="1.2.0"></a>
# 1.2.0

- Added support to list, view and re-send / retry event notifications.
- Added support to list, view, update and create event subscriptions.

<a name="1.1.1"></a>
# 1.1.1

- Updated reports and dashboard to allow selection of primary or secondary reporting currency.
- Updated dashboard to use formatted currency based on user settings and locale.

<a name="1.1.0"></a>
# 1.1.0

- Added Settings> Tax. Allows you to configure and modify tax settings.
- Added Developer> Templates. Allows you to list, configure and modify templates.
- Allow app installations and account activations while running admin within the staging environment.

<a name="1.0.3"></a>
# 1.0.3

Allowed apps to launch correctly when running the admin against the staging environment.

<a name="1.0.2"></a>
# 1.0.2

- Fixed bug that prevented the refund modal from automatically closing when a refund was successfully processed.
- Fixed bug that caused incorrect sales tax percentage display in refund modal.
- Fixed bug that directed app icon clicks to an invalid location.


<a name="1.0.1"></a>
# 1.0.1

- Added Settings> Subscription section to control panel with associated help text.

<a name="1.0.0"></a>
# 1.0.0

This is the initial public release of the Comecero admin control panel. The control panel has been in use in a production environment for quite some time, but this '1.0' release represents the public, open source release of the project, including an MIT license.
