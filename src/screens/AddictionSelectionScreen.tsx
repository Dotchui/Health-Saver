import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COMMON_ADDICTIONS, Addiction, ADDICTION_SAVINGS_MAP, DEFAULT_SAVINGS } from '../types';

type RootStackParamList = {
  Home: undefined;
  AddictionSelection: undefined;
  ReminderSettings: {
    addictionId: string;
    initialDailyHours?: number;
    initialDailyMoney?: number;
  };
  Stats: { addictionId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AddictionSelection'>;

export default function AddictionSelectionScreen({ navigation }: Props) {
  const [selectedAddiction, setSelectedAddiction] = useState<Addiction | null>(null);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [estimatedMoney, setEstimatedMoney] = useState<number>(0);

  const handleSelectAddiction = (addiction: Addiction) => {
    const defaultHours = ADDICTION_SAVINGS_MAP[addiction.id]?.dailyHours || DEFAULT_SAVINGS.dailyHours;
    const defaultDailyMoney = ADDICTION_SAVINGS_MAP[addiction.id]?.dailyMoney || DEFAULT_SAVINGS.dailyMoney || 0;
    setEstimatedHours(defaultHours);
    setEstimatedMoney(defaultDailyMoney * 30);
    setSelectedAddiction(addiction);
    setModalStep(1);
  };

  const handleConfirm = () => {
    if (!selectedAddiction) return;
    const addId = selectedAddiction.id;
    setSelectedAddiction(null);
    navigation.navigate('ReminderSettings', {
      addictionId: addId,
      initialDailyHours: estimatedHours,
      initialDailyMoney: estimatedMoney / 30,
    });
  };

  const handleHourStep = (delta: number) => {
    setEstimatedHours((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return (Math.max(0.5, Math.min(24, next)));
    });
  };

  const handleMoneyStep = (delta: number) => {
    setEstimatedMoney((prev) => {
      const next = prev + delta;
      return (Math.max(0, next));
    });
  };

  const renderAddictionItem = ({ item }: { item: Addiction }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectAddiction(item)}
    >
      <Text style={styles.icon}>{item.icon}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  const hourPresets = [0.5, 1, 2, 3, 4, 6];
  const moneyPresets = [0, 25, 50, 100, 200, 500];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose what you want to overcome</Text>
      </View>

      <FlatList
        data={COMMON_ADDICTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderAddictionItem}
        contentContainerStyle={styles.listContainer}
      />

      {/* Estimation Modal */}
      <Modal
        transparent
        visible={selectedAddiction !== null}
        animationType="fade"
        onRequestClose={() => setSelectedAddiction(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedAddiction(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.iconCircle}>
                  <Text style={styles.modalIcon}>
                    {modalStep === 1 ? selectedAddiction?.icon || '⏱️' : '💸'}
                  </Text>
                </View>

                {modalStep === 1 ? (
                  /* --- STEP 1: TIME ESTIMATION --- */
                  <>
                    <Text style={styles.modalTitle}>Daily Time Lost</Text>
                    <Text style={styles.modalSubtitle}>
                      How much time per day do you estimate losing to{' '}
                      <Text style={styles.boldAddictionName}>{selectedAddiction?.name}</Text>?
                    </Text>

                    {/* Hour Stepper Controller */}
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepButton}
                        onPress={() => handleHourStep(-0.5)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepButtonText}>−</Text>
                      </TouchableOpacity>

                      <View style={styles.stepperDisplay}>
                        <Text style={styles.stepperValue}>{estimatedHours}</Text>
                        <Text style={styles.stepperUnit}>
                          {estimatedHours === 1 ? 'hour / day' : 'hours / day'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.stepButton}
                        onPress={() => handleHourStep(0.5)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Quick Preset Pills for Time */}
                    <View style={styles.presetsRow}>
                      {hourPresets.map((hrs) => (
                        <TouchableOpacity
                          key={hrs}
                          style={[
                            styles.presetPill,
                            estimatedHours === hrs && styles.presetPillActive,
                          ]}
                          onPress={() => setEstimatedHours(hrs)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.presetPillText,
                              estimatedHours === hrs && styles.presetPillTextActive,
                            ]}
                          >
                            {hrs}h
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setSelectedAddiction(null)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.continueBtn}
                        onPress={() => setModalStep(2)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.continueBtnText}>Next →</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  /* --- STEP 2: MONEY ESTIMATION --- */
                  <>
                    <Text style={styles.modalTitle}>Monthly Cost</Text>
                    <Text style={styles.modalSubtitle}>
                      How much money per month do you estimate spending on{' '}
                      <Text style={styles.boldAddictionName}>{selectedAddiction?.name}</Text>?
                    </Text>

                    {/* Money Stepper Controller */}
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepButton}
                        onPress={() => handleMoneyStep(-10)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepButtonText}>−</Text>
                      </TouchableOpacity>

                      <View style={styles.stepperDisplay}>
                        <Text style={styles.stepperValue}>${estimatedMoney}</Text>
                        <Text style={styles.stepperUnit}>/ month</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.stepButton}
                        onPress={() => handleMoneyStep(10)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Quick Preset Pills for Money */}
                    <View style={styles.presetsRow}>
                      {moneyPresets.map((amt) => (
                        <TouchableOpacity
                          key={`money-${amt}`}
                          style={[
                            styles.presetPill,
                            estimatedMoney === amt && styles.presetPillActive,
                          ]}
                          onPress={() => setEstimatedMoney(amt)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.presetPillText,
                              estimatedMoney === amt && styles.presetPillTextActive,
                            ]}
                          >
                            ${amt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setModalStep(1)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelBtnText}>← Back</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.continueBtn}
                        onPress={handleConfirm}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.continueBtnText}>Confirm →</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 10,
    backgroundColor: '#292949',
    paddingTop: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
  },
  listContainer: {
    padding: 25,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 40,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#6366f1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  boldAddictionName: {
    fontWeight: '700',
    color: '#4f46e5',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4f46e5',
  },
  stepperDisplay: {
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1f2937',
  },
  stepperUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  presetPillActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  presetPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  presetPillTextActive: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4b5563',
  },
  continueBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
