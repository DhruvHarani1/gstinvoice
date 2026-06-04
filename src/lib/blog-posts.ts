export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  readTime: string;
  category: string;
  contentHtml: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-create-gst-invoice-freelancers-india-guide',
    title: 'How to Create GST Invoice for Freelancers in India (2024 Guide)',
    description: 'A step-by-step guide outlining GST invoice requirements, required fields, tax rates, and billing structures for Indian freelancers and consultants.',
    publishDate: 'June 4, 2026',
    readTime: '3 min read',
    category: 'Guides',
    contentHtml: `
      <h2>Introduction to GST Invoicing</h2>
      <p>As a freelancer or independent consultant in India, generating professional and compliant invoices is crucial for smooth business operations. Once you cross the GST registration threshold or opt for voluntary registration, you must issue a tax-compliant GST invoice for all services rendered to clients.</p>
      
      <h2>Essential Fields on a GST Invoice</h2>
      <p>A valid tax invoice under the Indian GST regime must contain specific details. Omitting these fields can lead to compliance issues, penalties, or delays in payments from your clients. Ensure your invoices always include:</p>
      <ul>
        <li><strong>Invoice Numbering:</strong> A unique consecutive serial number containing only alphabets, numerals, or special characters (hyphen or slash), unique for a financial year.</li>
        <li><strong>Invoice Date:</strong> Date of issue of the invoice.</li>
        <li><strong>Supplier Details:</strong> Your registered business name, address, and 15-digit GSTIN.</li>
        <li><strong>Recipient Details:</strong> Name, billing address, and GSTIN of the client (if registered).</li>
        <li><strong>Place of Supply:</strong> State name indicating where the service is delivered (determines tax split).</li>
        <li><strong>HSN/SAC Code:</strong> The Service Accounting Code (SAC) representing your service type (e.g., 998311 for management consulting or 998313 for software design).</li>
        <li><strong>Description of Services:</strong> Clear specification of the work completed.</li>
        <li><strong>Taxable Value and Rates:</strong> Break down of the taxable value, applicable tax rate (usually 18% for service professionals), and the calculated tax amounts.</li>
      </ul>

      <h2>Choosing the Right Taxes: CGST, SGST, or IGST?</h2>
      <p>The type of GST applied depends entirely on the location of your business relative to the client's place of supply:</p>
      <p>1. <strong>Intrastate Supply (Same State):</strong> If you and your client reside in the same state, apply Central GST (CGST) and State GST (SGST) split equally (e.g., 9% CGST and 9% SGST for an 18% slab).</p>
      <p>2. <strong>Interstate Supply (Different States):</strong> If your client is located in another state, apply Integrated GST (IGST) at the full rate (e.g., 18% IGST).</p>

      <h2>Streamlining Invoicing with InvoiceWala</h2>
      <p>Manually computing tax splits and maintaining serial numbers in Excel can be time-consuming and prone to human errors. InvoiceWala solves this by offering a zero-hassle online invoice builder that automatically calculates CGST, SGST, or IGST based on the supply parameters, allows you to upload authorized signatures, and prints professional PDF invoices instantly.</p>
    `
  },
  {
    slug: 'cgst-vs-sgst-vs-igst-freelancers-guide',
    title: 'CGST vs SGST vs IGST: Complete Guide for Freelancers',
    description: 'Understand the difference between Central, State, and Integrated GST, how they are applied based on Place of Supply, and how to file them correctly.',
    publishDate: 'May 28, 2026',
    readTime: '4 min read',
    category: 'Compliance',
    contentHtml: `
      <h2>Understanding the Three Heads of GST</h2>
      <p>The Goods and Services Tax (GST) in India is a dual-structured taxation system. The tax is levied simultaneously by both the Central Government and State Governments. To keep track of revenues, GST is divided into three components: CGST, SGST, and IGST. For freelancers, knowing when to apply which component is vital to avoid audit errors.</p>
      
      <h2>CGST & SGST: The Intrastate Split</h2>
      <p>Central Goods and Services Tax (CGST) and State Goods and Services Tax (SGST) apply to intrastate transactions — transactions where the supplier (you) and the recipient (your client) are located in the same state. </p>
      <p>When billing a client inside your state, the total GST slab rate is divided equally between the Central Government (CGST) and the State Government (SGST). For example, if your services fall under the standard 18% service slab, your invoice will list:
      <ul>
        <li>CGST: 9% of the taxable amount</li>
        <li>SGST: 9% of the taxable amount</li>
      </ul>
      The total tax remains 18%, but it is legally split and directed to both treasuries.</p>

      <h2>IGST: The Interstate Component</h2>
      <p>Integrated Goods and Services Tax (IGST) is applied to interstate transactions — when the supplier and the customer are located in different states. It also applies to import and export transactions.</p>
      <p>If you are based in Karnataka and deliver consulting services to a client in Maharashtra, you will charge IGST at the full slab rate (e.g., 18% IGST) on the taxable value. No CGST or SGST splits are included in this scenario.</p>

      <h2>The Role of 'Place of Supply'</h2>
      <p>The Place of Supply (PoS) determines whether a transaction is intrastate or interstate. For service providers, the Place of Supply is generally the location of the service recipient. If the recipient is unregistered, PoS defaults to the address on record. If no address is available, the place of supply defaults to the provider's location.</p>
      
      <h2>How InvoiceWala Automates the Rules</h2>
      <p>Keeping track of client locations and applying correct tax logic manually can be tedious. InvoiceWala's billing platform automatically checks the supplier's state against the client's place of supply. It automatically generates CGST + SGST rows for intrastate clients and IGST rows for interstate clients, ensuring your billing is fully compliant without manual intervention.</p>
    `
  },
  {
    slug: 'gst-registration-freelancers-need-it',
    title: 'GST Registration for Freelancers: Do You Really Need It?',
    description: 'Learn about the threshold limits for GST registration in India, when registration becomes mandatory for service providers, and the advantages of getting a GSTIN voluntarily.',
    publishDate: 'May 15, 2026',
    readTime: '3 min read',
    category: 'Legal',
    contentHtml: `
      <h2>The Big Question: Do Freelancers Need GST?</h2>
      <p>With India's digital economy booming, thousands of software developers, content writers, designers, and marketing consultants operate as freelancers. One of the most common questions they face is: <em>"When do I need to register for GST?"</em> Let's demystify the rules for service providers.</p>
      
      <h2>The ₹20 Lakhs Threshold Rule</h2>
      <p>Under the current Indian tax laws, registration under GST is mandatory for any service provider whose aggregate turnover in a financial year exceeds <strong>₹20 Lakhs</strong>. For freelancers based in special category states (primarily in the North-Eastern and hill states, such as Manipur, Mizoram, or Uttarakhand), the threshold limit is reduced to <strong>₹10 Lakhs</strong>.</p>
      <p>If your annual earnings from freelancing are below these thresholds, you are legally exempt from registering for GST or collecting tax from your clients.</p>

      <h2>Exceptions: When GST Registration is Mandatory</h2>
      <p>While the ₹20 Lakhs threshold covers most local freelancers, there are critical exceptions where registration is mandatory regardless of turnover:
      <ul>
        <li><strong>Interstate Supplies:</strong> Under Section 24 of the CGST Act, making interstate supplies of services technically requires registration. However, the government has provided an exemption: service providers making interstate supplies are exempt from registration if their aggregate turnover remains under the ₹20 Lakhs limit.</li>
        <li><strong>Exporting Services:</strong> If you work with international clients (e.g. platforms like Upwork, Fiverr, or direct foreign companies), you are exporting services. Exports are treated as zero-rated interstate supplies. You must register for GST to legally export services and file a Letter of Undertaking (LUT) to claim zero-tax status.</li>
      </ul>
      </p>

      <h2>Benefits of Voluntary GST Registration</h2>
      <p>Even if your turnover is below ₹20 Lakhs, voluntarily registering for GST offers benefits:</p>
      <p>1. <strong>Input Tax Credit (ITC):</strong> You can claim back the GST paid on business expenses, such as laptops, office furniture, software subscriptions (Slack, Adobe, Zoom), and high-speed internet bills.</p>
      <p>2. <strong>Enterprise Clients:</strong> Large corporate clients prefer working with GST-registered vendors as they can claim Input Tax Credit on the services you provide. Being unregistered might lose you high-paying corporate contracts.</p>
      
      <h2>Easily Manage Your Bills with InvoiceWala</h2>
      <p>Whether you have a GSTIN or not, InvoiceWala helps you organize your business billing. Unregistered freelancers can generate plain "Bills of Supply" without GST fields, while registered consultants can configure their GSTIN and place of supply to generate full tax invoices within seconds.</p>
    `
  }
];
