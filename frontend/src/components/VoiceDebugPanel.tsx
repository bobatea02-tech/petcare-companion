/**
 * Debug panel for voice assistant responses
 * Shows the raw API response to verify speak_response and needs_clarification flags
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X } from 'lucide-react';

interface VoiceDebugPanelProps {
  lastResponse?: any;
}

export const VoiceDebugPanel = ({ lastResponse }: VoiceDebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <>
      {/* Debug Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg"
        title="Toggle Debug Panel"
      >
        <Bug className="w-6 h-6" />
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed bottom-20 left-4 z-50 w-96 max-h-96 bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-purple-600">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5" />
                <h3 className="font-semibold">Voice Debug Panel</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-purple-700 rounded p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-80">
              {lastResponse ? (
                <div className="space-y-3">
                  {/* Response Text */}
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Response:</div>
                    <div className="text-sm bg-gray-800 p-2 rounded">
                      {lastResponse.response}
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Speak Response:</div>
                      <div className={`text-sm px-2 py-1 rounded ${
                        lastResponse.speak_response 
                          ? 'bg-green-600' 
                          : 'bg-red-600'
                      }`}>
                        {lastResponse.speak_response !== undefined 
                          ? String(lastResponse.speak_response) 
                          : 'undefined'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-1">Needs Clarification:</div>
                      <div className={`text-sm px-2 py-1 rounded ${
                        lastResponse.needs_clarification 
                          ? 'bg-yellow-600' 
                          : 'bg-gray-700'
                      }`}>
                        {lastResponse.needs_clarification !== undefined 
                          ? String(lastResponse.needs_clarification) 
                          : 'undefined'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-1">Action Taken:</div>
                      <div className={`text-sm px-2 py-1 rounded ${
                        lastResponse.action_taken 
                          ? 'bg-blue-600' 
                          : 'bg-gray-700'
                      }`}>
                        {String(lastResponse.action_taken)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-1">Pet Identified:</div>
                      <div className={`text-sm px-2 py-1 rounded ${
                        lastResponse.pet_identified 
                          ? 'bg-green-600' 
                          : 'bg-gray-700'
                      }`}>
                        {String(lastResponse.pet_identified)}
                      </div>
                    </div>
                  </div>

                  {/* Action Details */}
                  {lastResponse.action_type && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Action Type:</div>
                      <div className="text-sm bg-gray-800 p-2 rounded">
                        {lastResponse.action_type}
                      </div>
                    </div>
                  )}

                  {/* Questions Remaining */}
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Questions Remaining:</div>
                    <div className="text-sm bg-gray-800 p-2 rounded">
                      {lastResponse.questions_remaining}
                    </div>
                  </div>

                  {/* Raw JSON */}
                  <details className="mt-4">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-white">
                      View Raw JSON
                    </summary>
                    <pre className="text-xs bg-gray-800 p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(lastResponse, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-8">
                  No response yet. Send a voice command to see debug info.
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-3 bg-gray-800 text-xs text-gray-400 border-t border-gray-700">
              <div className="font-semibold mb-1">Debug Info:</div>
              <ul className="space-y-1">
                <li>• speak_response should be <span className="text-green-400">true</span> for voice</li>
                <li>• needs_clarification should be <span className="text-yellow-400">true</span> for questions</li>
                <li>• Check console for voice synthesis logs</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
