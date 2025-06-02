/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.object.web.internal.object.entries.scheduler.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.object.exception.ObjectEntryExpirationDateException;
import com.liferay.object.field.builder.TextObjectFieldBuilder;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.model.ObjectEntry;
import com.liferay.object.related.models.test.util.ObjectEntryTestUtil;
import com.liferay.object.test.util.ObjectDefinitionTestUtil;
import com.liferay.petra.function.UnsafeRunnable;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.model.UserNotificationEvent;
import com.liferay.portal.kernel.scheduler.SchedulerJobConfiguration;
import com.liferay.portal.kernel.scheduler.TimeUnit;
import com.liferay.portal.kernel.service.UserNotificationEventLocalService;
import com.liferay.portal.kernel.test.AssertUtils;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.rule.DeleteAfterTestRun;
import com.liferay.portal.kernel.test.rule.Sync;
import com.liferay.portal.kernel.test.rule.SynchronousDestinationTestRule;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.TestPropsValues;
import com.liferay.portal.kernel.test.util.UserTestUtil;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.liferay.portal.test.rule.FeatureFlag;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.vulcan.util.LocalizedMapUtil;

import java.io.Serializable;

import java.time.LocalDate;
import java.time.ZoneId;

import java.util.Date;
import java.util.List;

import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * @author Jhosseph Gonzalez
 */
@FeatureFlag("LPD-17564")
@RunWith(Arquillian.class)
@Sync
public class CheckObjectEntrySchedulerJobConfigurationTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new AggregateTestRule(
			new LiferayIntegrationTestRule(),
			SynchronousDestinationTestRule.INSTANCE);

	@BeforeClass
	public static void setUpClass() throws Exception {
		_objectDefinition = ObjectDefinitionTestUtil.publishObjectDefinition(
			List.of(
				new TextObjectFieldBuilder(
				).userId(
					TestPropsValues.getUserId()
				).labelMap(
					LocalizedMapUtil.getLocalizedMap(
						RandomTestUtil.randomString())
				).name(
					_OBJECT_FIELD_NAME
				).build()));

		_jobExecutorUnsafeRunnable =
			_schedulerJobConfiguration.getJobExecutorUnsafeRunnable();
	}

	@Test
	public void testCheckObjectEntryExpirationDate() throws Exception {
		UserTestUtil.setUser(TestPropsValues.getUser());

		Date date = new Date();

		AssertUtils.assertFailure(
			ObjectEntryExpirationDateException.class,
			"Invalid date input. The expiration date cannot be a past date.",
			() -> ObjectEntryTestUtil.addObjectEntry(
				0, _objectDefinition.getObjectDefinitionId(),
				HashMapBuilder.<String, Serializable>put(
					_OBJECT_FIELD_NAME, RandomTestUtil.randomString()
				).put(
					"expirationDate",
					new Date(date.getTime() - TimeUnit.MINUTE.toMillis(1))
				).build()));

		ObjectEntry objectEntry1 = ObjectEntryTestUtil.addObjectEntry(
			0, _objectDefinition.getObjectDefinitionId(),
			HashMapBuilder.<String, Serializable>put(
				_OBJECT_FIELD_NAME, RandomTestUtil.randomString()
			).put(
				"expirationDate", date
			).build());

		ObjectEntry objectEntry2 = ObjectEntryTestUtil.addObjectEntry(
			0, _objectDefinition.getObjectDefinitionId(),
			HashMapBuilder.<String, Serializable>put(
				_OBJECT_FIELD_NAME, RandomTestUtil.randomString()
			).put(
				"expirationDate",
				new Date(date.getTime() + TimeUnit.MINUTE.toMillis(5))
			).build());

		_jobExecutorUnsafeRunnable.run();

		Assert.assertEquals(
			WorkflowConstants.STATUS_EXPIRED, objectEntry1.getStatus());

		Assert.assertTrue(objectEntry1.isExpired());

		Assert.assertFalse(objectEntry2.isExpired());
	}

	@Test
	public void testCheckObjectEntryReviewDate() throws Exception {
		UserTestUtil.setUser(TestPropsValues.getUser());

		Date date = new Date();

		ObjectEntry objectEntry = ObjectEntryTestUtil.addObjectEntry(
			0, _objectDefinition.getObjectDefinitionId(),
			HashMapBuilder.<String, Serializable>put(
				_OBJECT_FIELD_NAME, RandomTestUtil.randomString()
			).put(
				"reviewDate",
				new Date(date.getTime() - TimeUnit.MINUTE.toMillis(1))
			).build());

		ObjectEntryTestUtil.addObjectEntry(
			0, _objectDefinition.getObjectDefinitionId(),
			HashMapBuilder.<String, Serializable>put(
				_OBJECT_FIELD_NAME, RandomTestUtil.randomString()
			).put(
				"reviewDate",
				new Date(date.getTime() + TimeUnit.MINUTE.toMillis(5))
			).build());

		_jobExecutorUnsafeRunnable.run();

		List<UserNotificationEvent> userNotificationEvents =
			_userNotificationEventLocalService.getUserNotificationEvents(
				objectEntry.getUserId(), _objectDefinition.getPortletId(),
				LocalDate.now(
				).atStartOfDay(
					ZoneId.systemDefault()
				).toInstant(
				).getEpochSecond(),
				true);

		Assert.assertEquals(
			userNotificationEvents.toString(), 1,
			userNotificationEvents.size());

		JSONObject jsonObject = JSONFactoryUtil.createJSONObject(
			userNotificationEvents.get(
				0
			).getPayload());

		Assert.assertTrue(
			Validator.isNotNull(jsonObject.get("notificationMessage")));
	}

	private static final String _OBJECT_FIELD_NAME =
		"a" + RandomTestUtil.randomString();

	private static UnsafeRunnable<Exception> _jobExecutorUnsafeRunnable;

	@DeleteAfterTestRun
	private static ObjectDefinition _objectDefinition;

	@Inject(
		filter = "component.name=com.liferay.object.web.internal.scheduler.CheckObjectEntrySchedulerJobConfiguration"
	)
	private static SchedulerJobConfiguration _schedulerJobConfiguration;

	@Inject
	private UserNotificationEventLocalService
		_userNotificationEventLocalService;

}