import {
  evaluatorTypeConfig,
  systemStatusConfig,
  userStatusConfig,
} from '@/src/app/regionen/[regionSlug]/_components/SidebarInspector/InspectorQa/qaConfigs'
import { invoke } from '@/src/blitz-server'
import getQaConfigStatsForAdmin from '@/src/server/qa-configs/queries/getQaConfigStatsForAdmin'
import 'server-only'

export async function QaConfigStatsTable({ configId }: { configId: number }) {
  const stats = await invoke(getQaConfigStatsForAdmin, { configId })

  return (
    <div className="mt-6">
      <h4 className="mb-3 text-sm font-semibold text-gray-900">Statistiken</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                EvaluatorType
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                EvaluationType
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                Anzahl
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {/* System evaluations */}
            <tr>
              <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900">
                {evaluatorTypeConfig.SYSTEM.label}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: systemStatusConfig.GOOD.hexColor }}
                  />
                  <span>
                    {systemStatusConfig.GOOD.label} <code className="text-xs">GOOD</code>
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-900">
                {stats.evaluationStats.SYSTEM.GOOD}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900">
                {evaluatorTypeConfig.SYSTEM.label}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: systemStatusConfig.NEEDS_REVIEW.hexColor }}
                  />
                  <span>
                    {systemStatusConfig.NEEDS_REVIEW.label}{' '}
                    <code className="text-xs">NEEDS_REVIEW</code>
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-900">
                {stats.evaluationStats.SYSTEM.NEEDS_REVIEW}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900">
                {evaluatorTypeConfig.SYSTEM.label}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: systemStatusConfig.PROBLEMATIC.hexColor }}
                  />
                  <span>
                    {systemStatusConfig.PROBLEMATIC.label}{' '}
                    <code className="text-xs">PROBLEMATIC</code>
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-900">
                {stats.evaluationStats.SYSTEM.PROBLEMATIC}
              </td>
            </tr>
            {/* User evaluations */}
            <tr>
              <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900">
                {evaluatorTypeConfig.USER.label}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: userStatusConfig.OK_STRUCTURAL_CHANGE.hexColor,
                    }}
                  />
                  <span>
                    {userStatusConfig.OK_STRUCTURAL_CHANGE.label}{' '}
                    <code className="text-xs">OK_STRUCTURAL_CHANGE</code>
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-900">
                {stats.evaluationStats.USER.OK_STRUCTURAL_CHANGE}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900">
                {evaluatorTypeConfig.USER.label}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: userStatusConfig.OK_REFERENCE_ERROR.hexColor }}
                  />
                  <span>
                    {userStatusConfig.OK_REFERENCE_ERROR.label}{' '}
                    <code className="text-xs">OK_REFERENCE_ERROR</code>
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-900">
                {stats.evaluationStats.USER.OK_REFERENCE_ERROR}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900">
                {evaluatorTypeConfig.USER.label}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: userStatusConfig.NOT_OK_DATA_ERROR.hexColor }}
                  />
                  <span>
                    {userStatusConfig.NOT_OK_DATA_ERROR.label}{' '}
                    <code className="text-xs">NOT_OK_DATA_ERROR</code>
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-900">
                {stats.evaluationStats.USER.NOT_OK_DATA_ERROR}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900">
                {evaluatorTypeConfig.USER.label}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: userStatusConfig.NOT_OK_PROCESSING_ERROR.hexColor,
                    }}
                  />
                  <span>
                    {userStatusConfig.NOT_OK_PROCESSING_ERROR.label}{' '}
                    <code className="text-xs">NOT_OK_PROCESSING_ERROR</code>
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-900">
                {stats.evaluationStats.USER.NOT_OK_PROCESSING_ERROR}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900">
                {evaluatorTypeConfig.USER.label}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: userStatusConfig.OK_QA_TOOLING_ERROR.hexColor }}
                  />
                  <span>
                    {userStatusConfig.OK_QA_TOOLING_ERROR.label}{' '}
                    <code className="text-xs">OK_QA_TOOLING_ERROR</code>
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-900">
                {stats.evaluationStats.USER.OK_QA_TOOLING_ERROR}
              </td>
            </tr>
            {/* Total row */}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-900">Total</td>
              <td className="px-4 py-2 text-sm text-gray-900"></td>
              <td className="px-4 py-2 text-right text-sm whitespace-nowrap text-gray-900">
                {stats.totalAreas}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
