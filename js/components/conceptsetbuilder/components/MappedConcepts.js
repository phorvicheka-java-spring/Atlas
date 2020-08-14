define([
	'jquery',
	'knockout',
	'text!./MappedConcepts.html',
	'services/VocabularyProvider',
	'utils/CommonUtils',
	'const',
	'atlas-state',
	'faceted-datatable'
], function (
		$,
		ko,
		template,
		VocabularyAPI,
		commonUtils,
		globalConstants,
		sharedState
		) {
	
	function MappedConcepts(params) {
		var self = this;
		
		self.conceptSet = ko.pureComputed(function () {
			return ko.toJS(params.conceptSet().expression);	
		});
		self.canEdit = params.canEdit;
		self.isLoading = ko.observable(true);
		
		self.selectedConcepts = ko.observableArray();

		self.selectedConceptsIndex = ko.pureComputed(function () {
			var index = {};
			self.selectedConcepts().forEach(function (item) {
				index[item.CONCEPT_ID] = 1;	
			});
			return index;
		});
		
		self.mappedConcepts = ko.observableArray();
		if (params.widget)
			params.widget(self);
		
		self.facetOptions = {
			Facets: [
				{
					'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				},
				{
					'caption': ko.i18n('facets.caption.class', 'Class'),
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
				},
				{
					'caption': ko.i18n('facets.caption.domain', 'Domain'),
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
				},
				{
					'caption': ko.i18n('facets.caption.standardConcept', 'Standard Concept'),
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
				},
				{
					'caption': ko.i18n('facets.caption.invalidReason', 'Invalid Reason'),
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
				},
				{
					'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'),
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT) > 0;
					}
				},
				{
					'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'),
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
					}
				}
			]
		};

		self.tableColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: this.canEdit });
	
		self.contextSensitiveLinkColor = function (row, data) {
			var switchContext;

			if (data.STANDARD_CONCEPT == undefined) {
					switchContext = data.concept.STANDARD_CONCEPT;
			} else {
					switchContext = data.STANDARD_CONCEPT;
			}

			switch (switchContext) {
				case 'N':
					$('a', row).css('color', '#800');
					break;
				case 'C':
					$('a', row).css('color', '#080');
					break;
			}
		}
		
		// behaviors
		
		self.refresh = function() {
			self.isLoading(true);
			self.selectedConcepts([]);
			VocabularyAPI.resolveConceptSetExpression(self.conceptSet()).then(function (identifiers) {
				VocabularyAPI.getMappedConceptsById(identifiers).then(function (concepts) {
					self.mappedConcepts(concepts);
				})
				.fail(function (err) {
					console.log("lookupByIds failed: " + err);
				})
				.always(function () {
					self.isLoading(false);
				});
			})
			.catch(function (err) {
				console.log("resolveConceptSetExpression failed: " + err);
				self.isLoading(false);
			});
		}
		
		// subscriptions
		
		self.conceptSetSubscription = self.conceptSet.subscribe(function (newValue){
			self.refresh();
		});
		
		// dispose
		
		self.dispose = function() {
			self.conceptSetSubscription.dispose();
			params.widget(null);
		}
		
		// startup actions
		self.refresh();
		
	}
	
	// return compoonent definition
	return {
		viewModel: MappedConcepts,
		template: template
	};
});