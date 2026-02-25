import React from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Plus,
  ArrowRight,
  CheckCircle,
  CreditCard,
  MapPin,
  FileText,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { BENEFITS, OFFER_ITEMS } from "./constants";

const BENEFIT_ICONS = [MapPin, FileText, CheckCircle];

interface NoDemandeLandingProps {
  onStartDemande: () => void;
}

const NoDemandeLanding: React.FC<NoDemandeLandingProps> = ({ onStartDemande }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-8">
        <Card className="p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-8 md:p-12 text-white relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIG9wYWNpdHk9Ii4xIiBmaWxsPSIjZmZmIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="relative max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-8 h-8" />
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Mohammadia Mall, Alger
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Domiciliez votre entreprise</h2>
              <p className="text-lg text-white/90 mb-6">
                Bénéficiez d'une adresse prestigieuse au c&#339;ur d'Alger. Création ou transfert de siège social.
              </p>
              <Button
                onClick={onStartDemande}
                size="lg"
                variant="default"
                className="bg-white text-amber-600 hover:bg-gray-100 shadow-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Commencer ma demande
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BENEFITS.map((benefit, index) => {
            const Icon = BENEFIT_ICONS[index];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 ${benefit.bg} border-0 hover:shadow-lg transition-shadow`}>
                  <div className={`w-12 h-12 ${benefit.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className="p-8">
          <div className="text-center mb-8">
            <CreditCard className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Notre offre</h3>
            <p className="text-gray-600">Tout ce dont vous avez besoin pour votre entreprise</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm text-amber-600 font-medium mb-2">Tarif mensuel</p>
                <p className="text-4xl font-bold text-gray-900">
                  12 000 <span className="text-xl text-gray-600">DA/mois</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">HT - Engagement 6 mois ou 1 an</p>
              </div>
              <div className="flex flex-col gap-3">
                {OFFER_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default NoDemandeLanding;
