﻿using System.Linq;
using System.Text;
using System.Web;
using System.Web.Http;
using DemoMethods.Entities;
using DemoMethods.Indexes;
using Raven.Client;

namespace DemoMethods.Basic
{
    public partial class BasicController : ApiController
    {        
        //TODO: Search by user string (in ui, suggest possible strings)
        [HttpGet]
        public object HighLights()
        {
            var nvc = HttpUtility.ParseQueryString(Request.RequestUri.Query);
            var search = nvc["Id"] ?? "USA";            

            using (var session = DocumentStoreHolder.Store.OpenSession())
            {
                FieldHighlightings highlightings;

                var results = session
                    .Advanced
                    .DocumentQuery<Company, IndexCompaniesAndAddresses>()
                    .Highlight("Address", 128, 1, out highlightings)
                    .Search("Address", search)
                    .ToList();

                var builder = new StringBuilder()
                    .AppendLine("<ul>");

                foreach (var fragments in results.Select(result => highlightings.GetFragments(result.Id)))
                {
                    builder.AppendLine(string.Format("<li>{0}</li>", fragments.First()));
                }

                var ul = builder
                    .AppendLine("</ul>")
                    .ToString();

                return ul;
            }
        }
    }
}